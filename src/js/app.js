import $ from 'jquery';
import {parseCode, getGraph} from './code-analyzer';
import fc from 'flowchart.js';


let nodesList = [];
let edgesList = [];
let allNodes = [];

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        nodeNum = 1;
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let input = $('#input').val();
        input = eval('[' + input + ']');
        let graph = getGraph(parsedCode,input);
        nodesList = graph.nodes;
        edgesList = graph.edges;
        allNodes = graph.allNodes;
        draw();
    });
});

let nodeNum = 1;

function addNumber(diagram) {
    if (diagram.yes !== undefined) {
        addNumbersToNodes(diagram.yes,true);
        addNumbersToNodes(diagram.no);
    }
    else if (diagram.next !== undefined)
        addNumbersToNodes(diagram.next);
}

function addNumbersToNodes(diagram,isYes) {
    if(!isNaN(diagram.text.split('\n')[0])) return;
    diagram.text = nodeNum + '\n' + diagram.text;
    nodeNum++;
    if(diagram.next !== undefined && diagram.next.key === 'rd' && isYes) return;
    addNumber(diagram);
}

function getOutEdgesOfNode(node) {
    let res = [];
    edgesList.forEach((edge)=>{
        if(edge.from === node.name)
            res.push(edge);
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

function checkWhileIns(node) {
    if(!node.name.startsWith('w')) return true;
    let body;
    edgesList.forEach((edge)=>{
        if(edge.from === node.name && edge.dir !== undefined && edge.dir.startsWith('yes'))
            body = edge.to;
    });
    if(body === undefined) return true;
    let res = false;
    edgesList.forEach((edge)=>{
        if(edge.to === node.name && edge.from !== body)
            res = true;
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

function getAllNodesWithNoIn() {
    let res = [];
    nodesList.forEach((node)=>{
        if(!hasIn(node))
            res.push(node);
    });
    return res;
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

function getNeighbours(node) {
    let res = [];
    edgesList.forEach((edge) => {
        if(edge.from === node.name)
            res.push(getNode(edge.to));
    });
    return res;
}

function bestEffortSort() {
    let s = getAllNodesWithNoIn();
    let passed = [];
    let res = [];
    while(s.length>0){
        let n = s.pop();
        if(passed.indexOf(n.name) > -1) continue;
        passed.push(n.name);
        let neighbours = getNeighbours(n);
        s = s.concat(neighbours);
        res = res.concat(getOutEdgesOfNode(n));
    }
    return res;
}

function getEdges(){
    let res = '';
    edgesList = bestEffortSort();
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

function draw(){
    $('#diagram').empty();
    let nodes = getNodes();
    let edges = getEdges();
    let diagram = fc.parse( nodes + '\n' + edges);
    addNumbersToNodes(diagram.start);
    let options =
        {
            'flowstate' : {
                'green' : {'fill' : 'green'},
            }
        };
    diagram.drawSVG('diagram',options);
}