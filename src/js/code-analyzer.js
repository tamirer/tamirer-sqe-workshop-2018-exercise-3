import * as esprima from 'esprima';
import {main} from './find-path.js';
import {_getElem} from './tag';

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
let nodeToTag = [];
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

function checkWhileIns(node) {
    if(!node.name.startsWith('w')) return true;
    let body;
    edgesList.forEach((edge)=>{
        if(edge.from === node.name && edge.dir !== undefined && edge.dir.startsWith('yes'))
            body = edge.to;
    });
    let res = false;
    edgesList.forEach((edge)=>{
        if(edge.to === node.name && edge.from !== body)
            res = true;
    });
    return res;
}

function hasIn(node) {
    let res = checkWhileIns(node);
    if(!res) return res;
    else res = false;
    edgesList.forEach((edge) => {
        if(edge.to === node.name)
            res = true;
    });
    return res;
}

function addNode(name,type,label,options) {
    nodesList.push({name:name,type:type,value:label,options:options});
    allNodes.push({name:name,type:type,value:label,options:options});
}

function addEdge(Node1,Node2,dir) {
    if(Node2 === Node1) return;
    edgesList.push({from:Node1,to:Node2,dir:dir});

}

export function getGraph(parsedCode,input = [1,2,3]) {
    if(input.length < 1)
        input = [1,2,3];
    greenLines = main(parsedCode, input).greenLines;
    tagged = getElem(parsedCode);
    edgesList = [];
    nodesList = [];
    allNodes = [];
    decCount = 0;
    ifCount = 0;
    whileCount = 0;
    createGraph(tagged);
    changeStart();
    fixWhile();
    colorGraph();
    return {nodes:nodesList,edges:edgesList,allNodes:allNodes};
}

function handleItemHelper(item,lastNode) {
    if (item.type === 'WhileStatement')
        return handleWhile(item,lastNode);
    else if (item.type === 'VariableDeclaration')
        return handleVarDec(item,lastNode);
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
        if(item.ignore) return;
        lastNode = handleItem(item,lastNode);
    });
    return lastNode;
}

function handleWhile(item,lastNode){
    let newNode = 'w' + whileCount++;
    let cond = item.condition;
    addNode(newNode,'condition',cond);
    nodeToTag.push({node:newNode,tag:item});
    addEdge(lastNode,newNode);
    let body =  createGraph(getElem(item.pointer.body));
    addEdge(newNode,body,'yes,left');
    addEdge(body,newNode);
    shouldOpenNewNode = true;
    return newNode;
}

function handleIf(item,lastNode){
    let newNode = 'f' + ifCount++;
    nodeToTag.push({node:newNode,tag:item});
    let cond = item.condition;
    addNode(newNode,'condition',cond,'pass');
    addEdge(lastNode,newNode);
    let ditNode = createGraph(getElem({body:[item.pointer.consequent]}));
    if(item.pointer.alternate !== null) {
        let difNode = createGraph(getElem({body: [item.pointer.alternate]}));
        addEdge(newNode, difNode, 'no, right');
    }
    addEdge(newNode,ditNode,'yes, left');
    addEdge(start,lastNode);
    shouldOpenNewNode = true;
    return newNode;
}

function handleFunc(item,lastNode){
    addEdge(start,lastNode);
    shouldOpenNewNode = true;
    return lastNode;
}

function handleAssign(item,lastNode){
    return handleVarDec(item,lastNode);
}

function handleVarDec(item,lastNode){
    let decStr = decToString(item);
    if(shouldOpenNewNode){
        addEdge(lastNode,'d' + decCount);
        addNode('d' + decCount++,'operation',decStr);
        shouldOpenNewNode = false;
        return 'd' + (decCount-1);
    }
    else{
        let temp = getNode(lastNode);
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

function isConditionComplete(lastNode) {
    let yes = undefined,no = undefined;
    edgesList.forEach((edge)=>{
        if(edge.from === lastNode && edge.dir !== undefined ) {
            if (edge.dir.startsWith('yes'))
                yes = true;
            else
                no = true;
        }
    });
    return yes && no;
}

function handleReturn(item,lastNode){
    let nodes = getFinalNodes();
    let dummyNode = 'rd'; //return dummy
    if(!isConditionComplete(lastNode))
        addEdge(lastNode,dummyNode,'no,right');
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
        else res.push(edge);
    });
    nodesList.forEach((node)=>{
        if(node.name.startsWith('w') && !hasIn(node)) {
            addNode('n' +node.name.split('')[1], 'operation', 'null');
            res.push({from:'n' +node.name.split('')[1], to:node.name});
        }
    });
    edgesList = res;
}

function decToString(item) {
    if(item.value === null)
        return item.name;
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
    //if(allRed(ins,node)) return false;
    let greenIns = getGreenIns(ins);
    let res = undefined;
    greenIns.forEach((inNode)=>{
        //if(res === true) return;
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
    nodeToTag.forEach((pair)=>{
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
    if(inNode.name.startsWith('w')) return true;
    if(condValue === true && (connection.localeCompare('yes') === 0))
        return true;
    return condValue === false && (connection.localeCompare('no') === 0);

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

/*function allRed(nodes,node) {
    let res = true;
    if(nodes.length !== getInNodes(node).length) return false;
    nodes.forEach((node)=>{
        if(node.options === undefined || node.options === 'green')
            res = false;
    });
    return res;
}*/

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
