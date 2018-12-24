import * as esprima from 'esprima';
import * as escodegen from 'escodegen';
import {_getElem} from './tag';

let code = null;

export function main(_code,input) {
    code = JSON.parse(JSON.stringify(_code));
    if(getElem(code).length === 0)
        return {code:escodegen.generate(code),redLines:[],greenLines:[]};
    input = eval(input);
    let redLines = getRedLines(code,input);
    redLines = redLines.filter(function(item, pos) {
        return redLines.indexOf(item) === pos;
    });
    let greenLines = getGreenLines(code,input);
    greenLines = greenLines.filter(function(item, pos) {
        return greenLines.indexOf(item) === pos;
    });
    return {code:escodegen.generate(code), redLines:redLines, greenLines:greenLines};
}

/*
* 1) find all return statements
* 2) collect "if"s line while doing so
* 3) replace return body with {val: [line1,...,lineN]}
* 4) evaluate
* 5) get lines
* 6) each if in line is green
* 7) all others are red
* */



/*
* assuming obj is IfStatement and needs to be checked
* add return {val} to the body
* eval the function
* if
*
* */
function addReturn(obj,val) {
    let objCopy = JSON.parse(JSON.stringify(obj));
    let argument = JSON.stringify(esprima.parse(JSON.stringify(eval('{val: [true,' + val + ']}'))).body[0]);
    obj.consequent.body.push(
        JSON.parse(
            '{"type":"ReturnStatement","argument":' + argument + ',"loc":null}'
        ));
    removeIf(objCopy);
}

function needsToCheck(obj) {
    if(obj['type'] !== 'IfStatement') return false;
    let tagged = _tagged_;
    let res = false;
    tagged.forEach((item)=>{
        if(JSON.stringify(item.pointer) === JSON.stringify(obj))
            res = true;
    });
    return res;
}

function makeNewVal(obj,val){
    return obj.type === 'IfStatement'?val.concat([obj.loc.start.line]):val;
}

function replaceReturn(obj,val) {
    if(obj === null || obj === undefined) return;
    let res = undefined;
    if(Array.isArray(obj))
        obj.forEach((item) => {
            let temp = replaceReturn(item,val);
            if(temp !== undefined)
                res = temp;
        });
    Object.keys(obj).forEach(function(key) {
        if(!isNaN(key)||res !== undefined) return;
        let newVal = makeNewVal(obj,val);
        if(needsToCheck(obj))
            res = {dummy:addReturn(obj,newVal),if:obj};
        else
            res = replaceReturn(obj[key],key === 'consequent' ? newVal : val);
    });
    return res;
}

function removeIf(obj) {
    let res = [];
    _tagged_.forEach((item)=>{
        if(JSON.stringify(item.pointer) !== JSON.stringify(obj))
            res.push(item);
    });
    _tagged_ = res;
}

let _tagged_ = [];

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!CONTINUE HERE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//needs to loop through all of the ifs and concat the results
function calcLines(code, input) {
    let tagged = getElem(code);
    _tagged_ = tagged;
    let limit = tagged.length;
    let result = [];
    for(let i =0; i< limit; i++) {
        let codeCopy = JSON.parse(JSON.stringify(code));
        let res = replaceReturn(codeCopy, []);
        if(res === undefined) continue;
        //tagged = removeIf(tagged,res.if);
        let toEval = '(' + escodegen.generate(codeCopy) + ') (' + input.join(', ') + ' )';
        res = eval(toEval);
        if(res[0])
            result = result.concat(res[1]);
    }
    return result;
}

function getAllLines(code) {
    let tagged = getElem(code), res = [];
    tagged.forEach((item) => {
        res.push(item.line);
    });
    return res;
}

function getRedLines(code,input) {
    let res = calcLines(code, input);
    let allLines = getAllLines(code);
    return allLines.filter(function(i) {return res.indexOf(i) < 0;});
}

function getGreenLines(code,input) {
    return calcLines(code, input);
}

function getElem(parsedCode){
    let tagged = _getElem(parsedCode);
    let res = [];
    tagged.forEach((item)=>{
        if(item.type === 'IfStatement')
            res.push(item);
    });
    return res;
}



























/*
function getElemHelper(obj,res) {
    if(obj === null || obj === undefined) return;
    if(Array.isArray(obj))
        obj.forEach((item) => {
            getElemHelper(item,res);
        });

    Object.keys(obj).forEach(function(key) {
        if(!isNaN(key)) return;
        if(obj[key] === 'IfStatement')
            _tagged_.push(getIfExp(obj));
        else
            getElemHelper(obj[key],res);
    });
}

let _tagged_ = [];

function _getElem(parsedCode) {
    let res = JSON.parse(JSON.stringify(_tagged_));
    _tagged_ = [];
    getElemHelper(parsedCode,res);
    return res.concat(_tagged_);
}

function getIfExp(item){
    let result = [];
    let condition = escodegen.generate(item.test);
    let line = item.loc.start.line;
    let value = null;
    let name = null;
    let type = item.type;
    result.push({line:line,type:type,name:name,condition:condition,value:value,pointer:item});
    result = result.concat(_getElem(item.consequent));
    let temp = item.alternate === null ? [] : _getElem(item.alternate);
    result = result.concat(temp);
    return result;
}

*/