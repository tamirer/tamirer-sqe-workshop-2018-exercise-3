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
let whileCount = 0;
let shouldOpenNewNode = true;
let start = 'st';

let edgesList = [];
let nodesList = [];
let allNodes = [];
let ifNodeTag = [];
let greenLines = undefined;
let tagged = undefined;

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
    allNodes.forEach((node)=>{
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

function topologicalSort() {
    let l = [];
    let s = getAllNodesWithNoIn();
    while (s.length > 0) {
        let n = s.pop();
        l = l.concat(getOutEdgesOfNode(n));
        getNeighbours(n).forEach((m) => {
            removeEdge({from: n.name, to: m.name});
            if (!hasIn(m))
                s.push(m);
        });
    }
    return l;
}

function bestEffortSort() {
    let s = getAllNodesWithNoIn();
    let passed = [];
    let res = [];
    while(s.length>0){
        let n = s.pop();
        if(passed.indexOf(n) > -1) continue;
        passed.push(n);
        let neighbours = getNeighbours(n);
        s = s.concat(neighbours);
        res = res.concat(getOutEdgesOfNode(n));
    }
    return res;
}

function sortEdges() {
    return bestEffortSort();
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
    allNodes.push({name:name,type:type,value:label,options:options});
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
                'green' : {'fill' : 'green'},
            }
        };
    diagram.drawSVG('diagram',options);
}

export function getGraph(parsedCode,input = [1,2,3]) {
    console.log(parsedCode);
    greenLines = main(parsedCode, input).greenLines;
    tagged = getElem(parsedCode);
    console.log(tagged);
    edgesList = [];
    nodesList = [];
    decCount = 0;
    ifCount = 0;
    whileCount = 0;
    createGraph(tagged);
    changeStart();
    fixWhile();
    colorGraph();
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
        return handleReturn(item,lastNode);
    else
        return handleItemHelper(item,lastNode);
}

function createGraph(_tagged){
    let lastNode = 'st';
    shouldOpenNewNode = true;
    _tagged.forEach((item)=>{
        lastNode = handleItem(item,lastNode);
    });
    return lastNode;
}

function handleWhile(item,lastNode){
    if(item.ignore)return lastNode;
    let newNode = 'w' + whileCount++;
    let cond = item.condition;
    addNode(newNode,'condition',cond);
    addEdge(lastNode,newNode);
    let body =  createGraph(getElem(item.pointer.body));
    addEdge(newNode,body,'yes,left');
    addEdge(body,newNode);
    shouldOpenNewNode = true;
    return newNode;
}

function handleIf(item,lastNode){
    if(item.ignore) return lastNode;
    let newNode = 'f' + ifCount++;
    ifNodeTag.push({node:newNode,tag:item});
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

function handleReturn(item,lastNode){
    let nodes = getFinalNodes();
    let dummyNode = 'rd'; //return dummy
    if(getNode(lastNode).type !== 'condition')
        addEdge(lastNode,dummyNode);
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

function fixWhile() {
    let res = [];
    edgesList.forEach((edge)=>{
        if(edge.from.split('')[0] === 'w' && edge.dir === undefined)
            res.push({from:edge.from,to:edge.to,dir:'no,right'});
        else
            res.push(edge);
    });
    edgesList = res;
}

function decToString(item) {
    if(item.value === null || item.ignore)
        return null;
    return item.name + ' = ' + item.value;
}

function colorGraph() {
    let res = [];
    let len = nodesList.length;
    while(res.length < len)
    {
        let node = nodesList.pop();
        if(nodeInList(node.name,res)) continue;
        let color = shouldColor(node,res);
        if(color === true)
            res.push({name:node.name,type:node.type,value:node.value,options:'green'});
        else if(color === false)
            res.push({name:node.name,type:node.type,value:node.value,options:'red'});
        nodesList.unshift(node);
    }
    nodesList = res;
}

/*
* if the node has no in than true
* if all of the ins are unchecked than return undefined
* if one of the ins are green and unconditioned return true
* if all of the ins are red return false
* if some are red and some are unchecked return undefined
* if one of the ins are green and conditioned check if the condition was met
* */

function shouldColor(node,checked) {
    if(!hasIn(node))
        return true;
    let ins = getCheckedIns(node,checked);
    if(ins.length === 0) return undefined;
    if(allRed(ins,node)) return false;
    let greenIns = getGreenIns(ins);
    let res = undefined;
    greenIns.forEach((inNode)=>{
        if(res === true) return;
        if(!isConditioned(inNode))
            res = true;
        else
            res = isCondMet(inNode,node);
    });
    return checkRes(res,ins,node);
}

function checkRes(res,ins,node) {
    if(res) return true;
    if(ins.length === getInNodes(node).length) return false;
    return undefined;
}


//inNode is a condition which is green
//if its true and goes to node with yes than true
//if its false and goes to node with no than true
//else return false
/*
* nodeValue = true <=> cond is green
*
*
* */

function getCondValue(inNode) {
    let name = inNode.name;
    let tag = null;
    ifNodeTag.forEach((pair)=>{
        if(pair.node === name)
            tag = pair.tag;
    });
    let res = false;
    greenLines.forEach((line)=>{
        if(tag.line === line)
            res = true;
    });
    return res;
}

function getConnectionToNode(inNode,node) {
    let res = undefined;
    edgesList.forEach((edge)=>{
        if(edge.from === inNode.name && edge.to === node.name)
            res = edge.dir.split(',')[0].trim();
    });
    return res;
}

function isCondMet(inNode,node) {
    let condValue = getCondValue(inNode);
    let connection = getConnectionToNode(inNode,node);
    if(condValue === true && (connection.localeCompare('yes') === 0))
        return true;
    if(condValue === false && (connection.localeCompare('no') === 0))
        return true;
    return false;
}

function isConditioned(inNode) {
    return inNode.type === 'condition';
}

function getGreenIns(checked) {
    let res = [];
    checked.forEach((node)=>{
        if(node.options === 'green')
            res.push(node);
    });
    return res;
}

function allRed(nodes,node) {
    let res = true;
    if(nodes.length !== getInNodes(node).length) return false;
    nodes.forEach((node)=>{
        if(node.options === undefined || node.options === 'green')
            res = false;
    });
    return res;
}

function getCheckedIns(node,checked) {
    let ins = getInNodes(node);
    let res = [];
    checked.forEach((check)=>{
        if(nodeInList(check.name,ins))
            res.push(check);
    });
    return res;
}

function getInNodes(node) {
    let res = [];
    edgesList.forEach((e)=>{
        if(e.to === node.name)
            if(!nodeInList(e.from,res))
                res.push(getNode(e.from));
    });
    return res;
}

function nodeInList(name,list) {
    let res = false;
    if(list.length === 0) return res;
    list.forEach((node)=>{
        if(node.name === name)
            res = true;
    });
    return res;
}

export {parseCode};
