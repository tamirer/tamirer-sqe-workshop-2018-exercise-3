import * as esprima from 'esprima';
import fc from 'flowchart.js';
import {main} from './find-path.js';
import {_getElem} from './tag';
import $ from 'jquery';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse,{loc:true});
};

let getElem = _getElem;

/*
'st=>start: Start\n' +
    'e=>end: End\n' +
    'op1=>operation: My Operation\n' +
    'op2=>operation: Stuff\n' +
    'sub1=>subroutine: My Subroutine\n' +
    'cond=>condition: Yes\n' +
    'or No?\n' +
    'c2=>condition: Good idea\n'

 'st->op1(right)->cond\n' +
    'cond(yes, right)->c2\n' +
    'cond(no)->sub1(left)->op1\n' +
    'c2(yes)->e\n' +
    'c2(no)->op2->e\n'




    {
            'x': 0,
            'y': 0,
            'line-width': 3,
            'line-length': 50,
            'text-margin': 10,
            'font-size': 14,
            'font-color': 'black',
            'line-color': 'black',
            'element-color': 'black',
            'fill': 'white',
            'yes-text': 'yes',
            'no-text': 'no',
            'arrow-end': 'block',
            'scale': 1,
            // style symbol types
            /*'symbols': {
                'start': {
                    'font-color': 'red',
                    'element-color': 'green',
                    'fill': 'yellow'
                },
                'end':{
                    'class': 'end-element'
                }
            },
'flowstate' : {
    'current' : {'fill' : 'yellow', 'font-color' : 'red', 'font-weight' : 'bold'},
    /*'past' : { 'fill' : '#CCCCCC', 'font-size' : 12},
    'current' : {'fill' : 'yellow', 'font-color' : 'red', 'font-weight' : 'bold'},
    'future' : { 'fill' : '#FFFF99'},
    'request' : { 'fill' : 'blue'},
    'invalid': {'fill' : '#444444'},
    'approved' : { 'fill' : '#58C4A3', 'font-size' : 12, 'yes-text' : 'APPROVED', 'no-text' : 'n/a' },
    'rejected' : { 'fill' : '#C45879', 'font-size' : 12, 'yes-text' : 'n/a', 'no-text' : 'REJECTED' }
}
};

* */

let decCount = 0;
let ifCount = 0;
let shouldOpenNewNode = true;
let start = 'st';

let edgesList = [];
let nodesList = [];

function removeNode(name) {
    let len = nodesList.length;
    for(let i = 0; i < len; i++){
        if(nodesList[i].name === name){
            nodesList.splice(i,1);
            return;
        }
    }
}

function removeEdge(edge) {
    let len = edgesList.length;
    for(let i = 0; i < len; i++){
        if(edgesList[i].from === edge.from && edgesList[i].to === edge.to){
            edgesList.splice(i,1);
            return;
        }
    }
}

function removeAllEdges(name) {
    let len = edgesList.length;
    let res = [];
    for(let i = 0; i < len; i++){
        if(edgesList[i].from === name || edgesList[i].to === name){
            continue;
        }
        res.push(edgesList[i]);
    }
    edgesList = res;
}

function getNode(name) {
    let res = undefined;
    nodesList.forEach((node)=>{
        if(res !== undefined) return;
        if(node.name === name)
            res = node;
    });
    return res;
}

function getNodes() {
    let res = '';
    nodesList.reverse().forEach((node)=>{
        res += '\n' + node.name +'=>' + node.type +': ' + node.value;
        if(node.options !== undefined)
            res += '|'+ node.options;
    });
    return res;
}

function hasIn(node) {
    let res = false;
    edgesList.forEach((edge) => {
        if(edge.to === node.name)
            res = true;
    });
    return res;
}

function getOutEdgesOfNode(node) {
    let res = [];
    edgesList.forEach((edge)=>{
        if(edge.from === node.name)
            res.push(edge);
    });
    return res;
}

function getAllNodesWithNoIn() {
    let res = [];
    nodesList.forEach((node)=>{
        if(!hasIn(node))
            res.push(node);
    });
    return res;
}

function getNeighbours(node) {
    let res = [];
    edgesList.forEach((edge) => {
        if(edge.from === node.name)
            res.push(getNode(edge.to));
    });
    return res;
}
/* L ← Empty list that will contain the sorted elements
S ← Set of all nodes with no incoming edge
while S is non-empty do
    remove a node n from S
    add n to tail of L
    for each node m with an edge e from n to m do
        remove edge e from the graph
           if m has no other incoming edges then
                insert m into S
if graph has edges then
return error   (graph has at least one cycle)
else
return L   (a topologically sorted order)*/

function sortEdges() {
    let l = [];
    let s = getAllNodesWithNoIn();
    while(s.length > 0){
        let n = s.pop();
        l = l.concat(getOutEdgesOfNode(n));
        getNeighbours(n).forEach((m) => {
            removeEdge({from:n.name,to:m.name});
            if(!hasIn(m))
                s.push(m);
        });
    }
    return l;
}

function getEdges(){
    let res = '';
    edgesList = sortEdges();
    edgesList.forEach((edge)=>{
        res += '\n';
        if(edge.dir === undefined)
            res += edge.from + '->' + edge.to;
        else
            res += edge.from + '(' + edge.dir + ')->' + edge.to;
        res += '\n';
    });
    return res;
}

function addNode(name,type,label,options) {
    nodesList.push({name:name,type:type,value:label,options:options});
}

function addEdge(Node1,Node2,dir) {
    edgesList.push({from:Node1,to:Node2,dir:dir});

}

function draw(){
    $('#diagram').empty();
    let nodes = getNodes();
    let edges = getEdges();
    let diagram = fc.parse( nodes + '\n' + edges);
    let options =
        {
            'flowstate' : {
                'pass' : {'fill' : 'green'},
            }
        };
    diagram.drawSVG('diagram',options);
}

export function getGraph(parsedCode,input = [1,2,3]) {
    console.log(parsedCode);
    let greenLines = main(parsedCode, input).greenLines;
    let tagged = getElem(parsedCode);
    console.log(tagged);
    edgesList = [];
    nodesList = [];
    decCount = 0;
    ifCount = 0;
    createGraph(tagged);
    changeStart();
    //colorGraph(greenLines);
    draw();
}

function handleItemHelper(item,lastNode) {
    if (item.type === 'WhileStatement')
        return handleWhile(item,lastNode);
    else if (item.type === 'VariableDeclaration')
        return handleVarDec(item,lastNode);
    else if (item.type === 'AssignmentExpression')
        return handleAssign(item,lastNode);
}

function handleItem(item,lastNode) {
    if (item.type === 'FunctionDeclaration')
        return handleFunc(item,lastNode);
    else if (item.type === 'IfStatement')
        return handleIf(item,lastNode);
    else if(item.type === 'ReturnStatement')
        return handleReturn(item);
    else
        return handleItemHelper(item,lastNode);
}

function createGraph(tagged){
    let lastNode = 'st';
    shouldOpenNewNode = true;
    tagged.forEach((item)=>{
        lastNode = handleItem(item,lastNode);
    });
    return lastNode;
}

function handleIf(item,lastNode){
    if(item.ignore) return lastNode;
    let newNode = 'f' + ifCount++;
    let cond = item.condition;
    addNode(newNode,'condition',cond,'pass');
    addEdge(lastNode,newNode);
    let ditNode = createGraph(getElem({body:[item.pointer.consequent]}));
    let difNode = createGraph(getElem({body:[item.pointer.alternate]}));
    addEdge(newNode,ditNode,'yes, left');
    addEdge(newNode,difNode,'no, right');
    addEdge(start,lastNode);
    shouldOpenNewNode = true;
    return newNode;
}

function handleFunc(item,lastNode){
    if(item.ignore) return lastNode;
    addEdge(start,lastNode);
    shouldOpenNewNode = true;
    return lastNode;
}

function handleAssign(item,lastNode){
    if(item.ignore) return lastNode;
    return handleVarDec(item,lastNode);
}

function handleVarDec(item,lastNode){
    if(item.ignore) return lastNode;
    let decStr = decToString(item);
    if(decStr === null) return lastNode;
    if(shouldOpenNewNode){
        addEdge(lastNode,'d' + decCount);
        addNode('d' + decCount++,'operation',decStr);
        shouldOpenNewNode = false;
        return 'd' + (decCount-1);
    }
    else{
        let temp = getNode(lastNode);
        if(temp !== undefined)
            temp.value += '\n' + decStr;
    }
    return lastNode;
}

function isFinal(node) {
    let res = true;
    edgesList.forEach((edge)=>{
        if(edge.from === node)
            res = false;
    });
    return res;
}

function getFinalNodes() {
    let nodes = [];
    nodesList.forEach((node)=>{
        if(isFinal(node.name))
            nodes.push(node.name);
    });
    return nodes;
}

function handleReturn(item){
    let nodes = getFinalNodes();
    let dummyNode = 'rd'; //return dummy
    addNode(dummyNode,'end','call return');
    nodes.forEach((node) => {
        addEdge(node,dummyNode);
    });
    let returnNode = 'r';
    addNode(returnNode,'operation','return ' +  item.value);
    addEdge(dummyNode,returnNode);
}

function changeStart() {
    let rev = edgesList.reverse(), node = undefined;
    rev.forEach((edge)=>{
        if(node !== undefined)
            return;
        if(edge.from === 'st')
            node = edge.to;
    });
    removeNode('st');
    removeAllEdges('st');
    node = getNode(node);
    removeNode(node.name);
    addNode(node.name,'operation',node.value,node.options);
}

function decToString(item) {
    if(item.value === null || item.ignore)
        return null;
    return item.name + ' = ' + item.value;
}

export {parseCode};
