//https://eloquentjavascript.net/1st_edition/chapter4.html
var c = document.getElementById("pedigreeCanvas");
var ctx = c.getContext("2d");
document.getElementById("numboxYear").value = randBetween(1200, 1500);
var numGenerations = parseInt(document.getElementById("numboxGenerations").value, 10); //How many generations the pedigree chart should span (must be greater than zero)
var numParents = 2; //Generally leave this at 2 unless you have a weird race that requires more or fewer than two parents to give birth a new individual (must be integer >= 1)
var box = {height: parseInt(document.getElementById("numboxBoxHeight").value, 10), 
           width: parseInt(document.getElementById("numboxBoxWidth").value, 10), 
           border: "black", 
           fill: "white", 
           posX: 0, 
           posY: 0}; //initialize box object with default values
//box.height = 75; document.getElementById("numboxBoxHeight").value;
//box.width = document.getElementById("numboxBoxWidth").value;
var charStartAge = 18; //age at which Person 0 will be when the pedigree is generated
var childDeathRate = 0.3;
var connector = 50; //The width of the space between boxes of different generations
var desiredYear = 0; //The year that the pedigree chart will "end" on
var header = {height: 100, width: 100, isEnabled: true};
var immigrationRate = 0.2;
var lnameProp = 0; //controls how last names are propagated. 0 is patriarchal, 1 is matriarchal, 2+ is something else
var maxAge = 100;
var maxAgeDiff = 10; //maximum age difference (in years) for individuals within a relationship
var maxChildrenPerFam = 8;
var canMarginBottom = 10;
var canMarginLeft = 10;
var canMarginRight = 10;
var CanMarginTop = 10;
var marginBottom = 2;
var marginLeft = 10;
var marginRight = 10;
var marginTop = 5;
var sexualMaturityAge = 16;
var sexualMaturityEnd = 35;
var vertSpacer = 25; //minimum vertical space between boxes of the same generation
var year = document.getElementById("numboxYear").value; //origin year of the pedigree

var pedigree = parentsArray(generatePedigree()); //contains an array of person objects

//set canvas dimensions based on the number of generations and box size
c.width = (numGenerations * box.width) + (connector * (numGenerations - 1));
header.width = c.width;

if (header.isEnabled === true) {
    c.height = (Math.pow(numParents, (numGenerations - 1)) * box.height) + ((Math.pow(numParents, (numGenerations - 1)) - 1) * vertSpacer) + header.height;
} else {
    c.height = (Math.pow(numParents, (numGenerations - 1)) * box.height) + ((Math.pow(numParents, (numGenerations - 1)) - 1) * vertSpacer);
}

//console.log("Canvas height is: " + c.height + "px");
//console.log("Header height is: " + header.height + "px and width is: " + header.width + "px");

//  calcBoundaryPoint is supposed to determine where to place the first/topmost
//  element of a column in the pedigree
function calcBoundaryPoint (numItems, canvasHeight) {
    var startPoint = (1 / (numItems * 2)) * canvasHeight;
    return startPoint;
}

function calcChild (counter, numParents) {
    var curColNum = 0; //value of the number at the top of the current generation column
    var prevColNum = 0; //value of the number at the top of the previous generation column
    var temp = 0; //holds values for curColNum and prevColNum
    var generation = 0;

    if (counter <= 0) {
        return undefined;
    } else {
        while (temp <= counter) {
            temp += Math.pow(numParents, generation);
            if (temp <= counter) {
                prevColNum = curColNum;
                curColNum = temp;
            }
            generation++;
        }
        //console.log("Final temp " + temp + " curColNum " + curColNum + " prevColNum " + prevColNum);
        return Math.floor((counter - curColNum) / numParents) + prevColNum;
    }
}

function calcSpacing (bottom, top, numItems) {
    if (numItems <= 1) {
        //this if statement is to avoid a divide by zero issue
        var spacing = 0;
    } else {
        var spacing = (bottom - top) / (numItems - 1);
    }
    return spacing;
}

function calcVertOffset (numItems, canvasHeight) {
    var offset = canvasHeight / (numItems + 1);
    return offset;
}

function causeOfDeath () {
    return deathIllness[Math.floor(Math.random() * (deathIllness.length))];
}

function checkDeath (person) {
    //console.log("Death check age: " + person.age + " " + person.isAlive + " " + person.lifespan);
    if (person.age >= person.lifespan) {
        person.isAlive = false;
        //console.log("Age: " + person.age + "Lifespan: " + person.lifespan);
    }
}

function drawConnectors (parentX, parentY, childX, childY, color, width) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    ctx.moveTo(parentX, parentY);
    ctx.lineTo(parentX - ((parentX - childX) / 2), parentY);
    ctx.lineTo(parentX - ((parentX - childX) / 2), childY);
    ctx.lineTo(childX, childY);

    ctx.stroke();
}

function drawHeader () {
    ctx.font = "30px Arial";
    ctx.fillStyle = "Black";
    ctx.textAlign = "end";
    if (document.getElementById("chkGenerateBlank").checked) {
        ctx.fillText("The Lineage of ____________________ (Completed " + year + ")", c.width, 50);
    } else {
        ctx.fillText("The Lineage of " + pedigree[0].fname + " " + pedigree[0].lname + " (Completed " + year + ")", c.width, 50);   
    }
}

function drawProperty (message, x, y) {
    ctx.font = "12px serif";
    ctx.fillStyle = "Red";
    ctx.textAlign = "start";
    ctx.fillText(message, x, y);
}

function drawPedigree () {
    var bottomPoint = 0; //bottom boundary for column
    var curPerson = 0;
    var curX = 0;
    var curY = 0;
    //console.log(curY);
    var distCenter = 0; //distance between vertical centers
    var topPoint = 0; //top boundary for column

    ctx.beginPath();
    ctx.strokeStyle = box.border;
    ctx.fillStyle = box.fill;

    if (header.isEnabled === false) {

        for (var i = 1; i <= numGenerations; i++) {
            if (i == numGenerations) {
                curY = 0;
                for (var j = 0; j < Math.pow(numParents, i - 1); j++) {
                    ctx.rect(curX, curY, box.width, box.height);
                    pedigree[curPerson].cx = curX;
                    pedigree[curPerson].cy = curY + (box.height / 2);
                    pedigree[curPerson].px = curX + box.width;
                    pedigree[curPerson].py = curY + (box.height / 2);
                    //console.log("cx " + pedigree[curPerson].cx + " cy " + pedigree[curPerson].cy + " px " + pedigree[curPerson].px + " py " + pedigree[curPerson].py);
                    curY += (box.height + vertSpacer);
                    curPerson++;
                }
            } else {
                topPoint = Math.floor(calcBoundaryPoint(Math.pow(numParents, i - 1), c.height));
                //console.log("topPoint is " + topPoint + "px");
                bottomPoint = Math.floor(c.height - topPoint);
                //console.log("bottomPoint is " + bottomPoint + "px");
                curY = Math.floor(calcBoundaryPoint(Math.pow(numParents, i - 1), c.height) + ((box.height / 2) * (-1)));
                //console.log("Outer curY is " + curY + "px");
                distCenter = calcSpacing (bottomPoint, topPoint, Math.pow(numParents, i - 1));
                //console.log("DistCenter is " + distCenter);
                //distCenter = Math.floor((c.height - (calcBoundaryPoint(Math.pow(numParents, i - 1), c.height) * 2)) / Math.pow(numParents, i - 1));
                for (var j = 0; j < Math.pow(numParents, i - 1); j++) {
                    ctx.rect(curX, curY, box.width, box.height);
                    //console.log("Inner curY is " + curY + "px");

                    // test code
                    pedigree[curPerson].cx = curX;
                    pedigree[curPerson].cy = curY + (box.height / 2);
                    pedigree[curPerson].px = curX + box.width;
                    pedigree[curPerson].py = curY + (box.height / 2);
                    //console.log("cx " + pedigree[curPerson].cx + " cy " + pedigree[curPerson].cy + " px " + pedigree[curPerson].px + " py " + pedigree[curPerson].py);
                    //end test code

                    curY += distCenter;
                    curPerson++;
                }
                curX += (box.width + connector);
            }

            //curY = (box.height / 2) * (-1);
            //console.log(curY);

        }
    } else {
        for (var i = 1; i <= numGenerations; i++) {
            if (i == numGenerations) {
                curY = header.height;
                for (var j = 0; j < Math.pow(numParents, i - 1); j++) {
                    ctx.rect(curX, curY, box.width, box.height);
                    pedigree[curPerson].cx = curX;
                    pedigree[curPerson].cy = curY + (box.height / 2);
                    pedigree[curPerson].px = curX + box.width;
                    pedigree[curPerson].py = curY + (box.height / 2);
                    //console.log("cx " + pedigree[curPerson].cx + " cy " + pedigree[curPerson].cy + " px " + pedigree[curPerson].px + " py " + pedigree[curPerson].py);
                    curY += (box.height + vertSpacer);
                    curPerson++;
                }
            } else {
                topPoint = Math.floor(calcBoundaryPoint(Math.pow(numParents, i - 1), c.height - header.height));
                //console.log("topPoint is " + topPoint + "px");
                bottomPoint = Math.floor(c.height - topPoint - header.height);
                //console.log("bottomPoint is " + bottomPoint + "px");
                curY = Math.floor(calcBoundaryPoint(Math.pow(numParents, i - 1), c.height - header.height) + ((box.height / 2) * (-1))) + header.height;
                //console.log("Outer curY is " + curY + "px");
                distCenter = calcSpacing (bottomPoint, topPoint, Math.pow(numParents, i - 1));
                //console.log("DistCenter is " + distCenter);
                //distCenter = Math.floor((c.height - (calcBoundaryPoint(Math.pow(numParents, i - 1), c.height) * 2)) / Math.pow(numParents, i - 1));
                for (var j = 0; j < Math.pow(numParents, i - 1); j++) {
                    ctx.rect(curX, curY, box.width, box.height);
                    //console.log("Inner curY is " + curY + "px");

                    // test code
                    pedigree[curPerson].cx = curX;
                    pedigree[curPerson].cy = curY + (box.height / 2);
                    pedigree[curPerson].px = curX + box.width;
                    pedigree[curPerson].py = curY + (box.height / 2);
                    //console.log("cx " + pedigree[curPerson].cx + " cy " + pedigree[curPerson].cy + " px " + pedigree[curPerson].px + " py " + pedigree[curPerson].py);
                    //end test code

                    curY += distCenter;
                    curPerson++;
                }
                curX += (box.width + connector);
            }

            //curY = (box.height / 2) * (-1);
            //console.log(curY);
        }
    }

    ctx.stroke();
}

function randBetween(a,b){
    // the +1 is to make the range upper inclusive
    return a + Math.floor(Math.random() * (b - a + 1));
}

function randomFirstName () {
    return firstNames[Math.floor(Math.random()*(firstNames.length))];
}

function fnameF () {
    return fnameFemale[Math.floor(Math.random()*(fnameFemale.length))];
}

function fnameM () {
    return fnameMale[Math.floor(Math.random() * (fnameMale.length))];
}

function randomLastName () {
	return lastNames[Math.floor(Math.random()*lastNames.length)];
}

function setFullName (person) {
    return person.fname + " " + person.lname;
}

function createPerson (child) {
    var person = new Object();
    person.isAlive = true;
    
	switch (child) {
        case 0: //sets initial properties for Person 0
            //var person = randGender();
            //person.fname = generateName();
            randGender(person);
            person.lname = randomLastName();
            person.age = charStartAge;
            person.lifespan = randBetween(charStartAge + 1, maxAge); //ensure Person 0 is never dead
            break;
        default:
            //var person = new Object();
            var parent_age_at_birth=randBetween(sexualMaturityAge, sexualMaturityEnd);
            //person.fname = randomFirstName();
            //person.lname = randomLastName();
            person.age = child.age + parent_age_at_birth;
            //person.lifespan = randBetween(sexualMaturityAge, maxAge);
            //console.log("Lifespan is " + person.lifespan);
            break;
    }
	return person;	
}

function setMale (person) {
    //var person = new Object();
    person.fname = fnameM();
    person.lname = undefined;
    person.sex = "male";
    person.lifespan = randBetween(sexualMaturityAge, maxAge);
    person.born = 0;
    //return person;
}

function setFemale (person) {
    //var person = new Object();
    person.fname = fnameF();
    person.lname = undefined;
    person.sex = "female";
    person.lifespan = randBetween(sexualMaturityAge, maxAge);
    person.born = 0;
    //return person;
}

function setOther (person) {
    //var person = new Object();
    person.fname = randomFirstName();
    person.lname = undefined;
    person.sex = "other";
    person.lifespan = randBetween(sexualMaturityAge, maxAge);
    person.born = 0;
    //return person;
}

function randGender (person) {
    var i = randBetween(1, numParents);
    switch (i) {
        case 1:
            setMale(person);
            break;
        case 2:
            setFemale(person);
            break;
        default:
            setOther(person);
            break;
    }
}

function generateParents(child, generationsLeft){
    // if a child has no .parents property, set the property to an empty array
    if (!child.parents){
        child.parents=[];
    }
    //if generationsLeft is initialized, begin for loop
    if (generationsLeft) {
        for(var i=0; i<numParents; i++){
            var parent = createPerson(child); //create a person to be the parent
            //set gender according to the number of parents
            switch (i) {
                case 0:
                    setMale(parent);
                    if (lnameProp == 0) {parent.lname = set_parent_lname(child);}
                    else {parent.lname = randomLastName();}
                    break;
                case 1:
                    setFemale(parent);
                    if (lnameProp == 1) {parent.lname = set_parent_lname(child);}
                    else {parent.lname = randomLastName();}
                    break;
                default:
                    setOther(parent);
                    if (lnameProp >= 2) {parent.lname = set_parent_lname(child);}
                    else {parent.lname = randomLastName();}
                    break;
            }
            child.parents.push(parent); //push the parent to the end of the .parents array
            generateParents(parent, generationsLeft - 1); //recurse through the pedigree and populate it
        }
    }
}

/*
//Original FishDavidson function, commenting out to test ezmac version
function generatePedigree () {
    var pedArr = new Array();

    for (var i = 1; i <= numGenerations; i++) {
        for (var j = 0; j < Math.pow(numParents, i - 1); j++) {
            pedArr.push(createPerson(i));
        }
    }
    return pedArr;
} */

function generatePedigree () {
    finalPerson=createPerson(0); //creates Person 0
    generateParents(finalPerson, numGenerations - 1); //assigns .parents property to person 0
    return finalPerson;
}

//ezmac comments
// I'm not doing great with functions and names but this works
// this function controls depth and appends the array in the right order
function parentsArray(person){
    var arr = [];
    var depth = numGenerations;
    //iterate through the generations, concatenating the results of BFRDescent to arr[]
    for( var i = 0; i <= depth; i++){
        console.log("parentsArray i = " + i);
        console.log(arr);
        arr = arr.concat(BFRDescent(person, i));
    }
    return arr;
}

function BFRDescent(tree, depth){
    //returns an array of all the people of a certain depth
    var generation= [];
    if (depth == 0) {return [tree];} //return [tree] if at origin node (person 0)
    //otherwise recurse through the depths of the tree
    if (depth > 0){
        for (var j = 0; j < tree.parents.length; j++) {
            generation = generation.concat(BFRDescent(tree.parents[j], depth-1));
        }
    }
    console.log("BFRD j:" + j);
    console.log(generation);
    return generation;
}

function redraw () {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    refreshInputValues();
    drawPedigree();
    drawHeader();
    for (var i = 0; i <= pedigree.length - 1; i++) {
        checkDeath(pedigree[i]);
        if (pedigree[i].isAlive == false) {
            drawProperty(pedigree[i].fname + " " + pedigree[i].lname + " (D)", pedigree[i].cx + 10, pedigree[i].cy + 10);  
        } else {
            drawProperty(pedigree[i].fname + " " + pedigree[i].lname, pedigree[i].cx + 10, pedigree[i].cy + 10);   
        }
}

    for(var i = 1; i <= pedigree.length - 1; i++) {
        drawConnectors(pedigree[i].cx, pedigree[i].cy, pedigree[calcChild(i, numParents)].px, pedigree[calcChild(i, numParents)].py, "Black", 4);
    }
}

function writePedQuickView () {
    for (var i = 0; i <= pedigree.length - 1; i++) {
        checkDeath(pedigree[i]);
        if (pedigree[i].isAlive == false) {
            drawProperty(pedigree[i].fname + " " + pedigree[i].lname + " (D)", pedigree[i].cx + 10, pedigree[i].cy + 10);  
        } else {
            drawProperty(pedigree[i].fname + " " + pedigree[i].lname, pedigree[i].cx + 10, pedigree[i].cy + 10);
        }
    }
}

function drawNewChart () {
    if (document.getElementById("chkGenerateBlank").checked) {
        drawBlankForm();
    } else {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        numGenerations = parseInt(document.getElementById("numboxGenerations").value, 10);
        refreshInputValues();
        pedigree = parentsArray(generatePedigree());
        drawPedigree();
        drawHeader();
        writePedQuickView();
    }
    
    for(var i = 1; i <= pedigree.length - 1; i++) {
        drawConnectors(pedigree[i].cx, pedigree[i].cy, pedigree[calcChild(i, numParents)].px, pedigree[calcChild(i, numParents)].py, "Black", 4);
    }
}

function refreshInputValues () {
    year = document.getElementById("numboxYear").value;
    box.height = parseInt(document.getElementById("numboxBoxHeight").value, 10);
    box.width = parseInt(document.getElementById("numboxBoxWidth").value, 10);
    c.width = (numGenerations * box.width) + (connector * (numGenerations - 1));
    
    //re-evaluate this once header checkbox support is implemented
    if (header.isEnabled === true) {
        c.height = (Math.pow(numParents, (numGenerations - 1)) * box.height) + ((Math.pow(numParents, (numGenerations - 1)) - 1) * vertSpacer) + header.height;
    } else {
        c.height = (Math.pow(numParents, (numGenerations - 1)) * box.height) + ((Math.pow(numParents, (numGenerations - 1)) - 1) * vertSpacer);
    }
}

function shuffleArray (array) {
// Randomize array element order in-place.
// Using Durstenfeld shuffle algorithm.

    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function calcYear (finishingYear, offset) {
    calculatedYear = finishingYear - offset;
    if (calculatedYear < 0) {return calculatedYear + " BCE";}
    else {return calculatedYear;} 
}

function drawBlankForm () {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    numGenerations = parseInt(document.getElementById("numboxGenerations").value, 10);
    refreshInputValues();
    pedigree = parentsArray(generatePedigree());
    drawPedigree();
    drawHeader();
    
    for(var i = 1; i <= pedigree.length - 1; i++) {
        drawConnectors(pedigree[i].cx, pedigree[i].cy, pedigree[calcChild(i, numParents)].px, pedigree[calcChild(i, numParents)].py, "Black", 4);
    }
}

function set_parent_lname (child) {
    var lastname = "LAST_NAME";
    switch (lnameProp) {
        case 0:
            lastname = child.lname;
            break;
        case 1:
            lastname = child.parents[1].lname;
            break;
        default:
            lastname = randomLastName();
            break;
    }
    return lastname
}

function calculate_lname (propStyle, person) {
    var lastname = "LAST_NAME";
    switch (propStyle) {
        case 0:
            lastname = person.parents[0].lname;
            break;
        case 1:
            lastname = person.parents[1].lname;
            break;
        default:
            lastname = randomLastName();
            break;
    }
    return lastname
}

function proplname () {
    var depth = 4;
    if (depth == 4) {
        calculate_lname();
    }
}

//test code

for (i = 0; i <= pedigree.length - 1; i++) {
    console.log("pedigree" + i + " is " + pedigree[i].fname + " compared to 0, which is " + pedigree[0].fname + " Age: " + pedigree[i].age);
}

//end test

drawPedigree();
drawHeader();
//drawProperty(pedigree[4].fname, 50, 50);

for (var i = 0; i <= pedigree.length - 1; i++) {
    checkDeath(pedigree[i]);
    if (pedigree[i].isAlive == false) {
        drawProperty(pedigree[i].fname + " " + pedigree[i].lname + " (D)", pedigree[i].cx + 10, pedigree[i].cy + 10);  
    } else {
        drawProperty(pedigree[i].fname + " " + pedigree[i].lname, pedigree[i].cx + 10, pedigree[i].cy + 10);   
    }
}

for(var i = 1; i <= pedigree.length - 1; i++) {
    drawConnectors(pedigree[i].cx, pedigree[i].cy, pedigree[calcChild(i, numParents)].px, pedigree[calcChild(i, numParents)].py, "Black", 4);
    console.log("Child of " + i + " is " + calcChild(i, 2));
}

/*for (var i = 0; i <= 100; i++) {
    console.log("Testing Randbetween(15,100)" + randBetween(15, 100));
} */

/*ctx.font = "12px serif";
ctx.fillStyle = "Red";
ctx.textAlign = "start";
var text = ctx.measureText("Poopoo!");
console.log(text.width);
ctx.fillText(causeOfDeath(), 100, 200);

ctx.font = "30px Arial";
text = ctx.measureText("Poopoo!");
console.log(text.width);
ctx.fillText("Poopoo!", 150, 300); */