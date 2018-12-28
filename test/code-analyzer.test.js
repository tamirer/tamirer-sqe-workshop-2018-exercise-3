import assert from 'assert';
import {getGraph, parseCode} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script","loc":{"start":{"line":0,"column":0},"end":{"line":0,"column":0}}}'
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a","loc":{"start":{"line":1,"column":4},"end":{"line":1,"column":5}}},"init":{"type":"Literal","value":1,"raw":"1","loc":{"start":{"line":1,"column":8},"end":{"line":1,"column":9}}},"loc":{"start":{"line":1,"column":4},"end":{"line":1,"column":9}}}],"kind":"let","loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":10}}}],"sourceType":"script","loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":10}}}'
        );
    });

    //dummy
    it('is parsing a simple variable declaration correctly', () => {
        let actual = getGraph(parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '    }\n' +
            '    \n' +
            '    return c;\n' +
            '}\n'));
        let expected = {'nodes':[{'name':'d0','type':'operation','value':'a = x + 1\nb = a + y\nc = 0','options':'green'},{'name':'f0','type':'condition','value':'b < z','options':'green'},{'name':'f1','type':'condition','value':'b < z * 2','options':'green'},{'name':'d1','type':'operation','value':'c = c + 5','options':'red'},{'name':'d3','type':'operation','value':'c = c + z + 5','options':'red'},{'name':'d2','type':'operation','value':'c = c + x + 5','options':'green'},{'name':'rd','type':'end','value':'call return','options':'green'},{'name':'r','type':'operation','value':'return c','options':'green'}],'edges':[{'from':'rd','to':'r'},{'from':'d3','to':'rd'},{'from':'d2','to':'rd'},{'from':'d1','to':'rd'},{'from':'f0','to':'d1','dir':'yes, left'},{'from':'f0','to':'f1','dir':'no, right'},{'from':'f1','to':'d2','dir':'yes, left'},{'from':'f1','to':'d3','dir':'no, right'},{'from':'d0','to':'f0'}],'allNodes':[{'name':'d0','type':'operation','value':'a = x + 1\nb = a + y\nc = 0'},{'name':'f0','type':'condition','value':'b < z','options':'pass'},{'name':'d1','type':'operation','value':'c = c + 5'},{'name':'f1','type':'condition','value':'b < z * 2','options':'pass'},{'name':'d2','type':'operation','value':'c = c + x + 5'},{'name':'d3','type':'operation','value':'c = c + z + 5'},{'name':'rd','type':'end','value':'call return'},{'name':'r','type':'operation','value':'return c'},{'name':'d0','type':'operation','value':'a = x + 1\nb = a + y\nc = 0'}]};

        assert.deepEqual(
            JSON.stringify(actual)
            ,
            JSON.stringify(expected)
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        let actual = getGraph(parseCode('function foo(x){\n' +
            'let y = x;\n' +
            'while(x < 5){\n' +
            'x = x +1;\n' +
            '}\n' +
            'x = x + 2;\n' +
            'return x;\n' +
            '}'));
        let expected ={'nodes':[{'name':'d0','type':'operation','value':'y = x','options':'green'},{'name':'w0','type':'condition','value':'x < 5','options':'green'},{'name':'d1','type':'operation','value':'x = x + 1','options':'green'},{'name':'d2','type':'operation','value':'x = x + 2','options':'green'},{'name':'rd','type':'end','value':'call return','options':'green'},{'name':'r','type':'operation','value':'return x','options':'green'}],'edges':[{'from':'rd','to':'r'},{'from':'d2','to':'rd'},{'from':'d2','to':'rd','dir':'no,right'},{'from':'w0','to':'d2','dir':'no,right'},{'from':'d1','to':'w0'},{'from':'w0','to':'d1','dir':'yes,left'},{'from':'d0','to':'w0'}],'allNodes':[{'name':'d0','type':'operation','value':'y = x'},{'name':'w0','type':'condition','value':'x < 5'},{'name':'d1','type':'operation','value':'x = x + 1'},{'name':'d2','type':'operation','value':'x = x + 2'},{'name':'rd','type':'end','value':'call return'},{'name':'r','type':'operation','value':'return x'},{'name':'d1','type':'operation','value':'x = x + 1'}]};

        assert.deepEqual(
            JSON.stringify(actual)
            ,
            JSON.stringify(expected)
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        let actual = getGraph(parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } \n' +
            '    return c;\n' +
            '}\n'));
        let expected ={'nodes':[{'name':'d0','type':'operation','value':'a = x + 1\nb = a + y\nc = 0','options':'green'},{'name':'f0','type':'condition','value':'b < z','options':'green'},{'name':'rd','type':'end','value':'call return','options':'green'},{'name':'d1','type':'operation','value':'c = c + 5','options':'red'},{'name':'r','type':'operation','value':'return c','options':'green'}],'edges':[{'from':'rd','to':'r'},{'from':'d1','to':'rd'},{'from':'f0','to':'rd','dir':'no,right'},{'from':'f0','to':'d1','dir':'yes, left'},{'from':'d0','to':'f0'}],'allNodes':[{'name':'d0','type':'operation','value':'a = x + 1\nb = a + y\nc = 0'},{'name':'f0','type':'condition','value':'b < z','options':'pass'},{'name':'d1','type':'operation','value':'c = c + 5'},{'name':'rd','type':'end','value':'call return'},{'name':'r','type':'operation','value':'return c'},{'name':'d0','type':'operation','value':'a = x + 1\nb = a + y\nc = 0'}]};

        assert.deepEqual(
            JSON.stringify(actual)
            ,
            JSON.stringify(expected)
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        let actual = getGraph(parseCode('function foo(x){\n' +
            'while(x < 5){\n' +
            'x = x +1;\n' +
            '}\n' +
            'return x;\n' +
            '}'));
        let expected ={'nodes':[{'name':'n0','type':'operation','value':'null','options':'green'},{'name':'w0','type':'condition','value':'x < 5','options':'green'},{'name':'d0','type':'operation','value':'x = x + 1','options':'green'},{'name':'rd','type':'end','value':'call return','options':'green'},{'name':'r','type':'operation','value':'return x','options':'green'}],'edges':[{'from':'rd','to':'r'},{'from':'w0','to':'rd','dir':'no,right'},{'from':'d0','to':'w0'},{'from':'w0','to':'d0','dir':'yes,left'},{'from':'n0','to':'w0'}],'allNodes':[{'name':'w0','type':'condition','value':'x < 5'},{'name':'d0','type':'operation','value':'x = x + 1'},{'name':'rd','type':'end','value':'call return'},{'name':'r','type':'operation','value':'return x'},{'name':'d0','type':'operation','value':'x = x + 1'},{'name':'n0','type':'operation','value':'null'}]};

        assert.deepEqual(
            JSON.stringify(actual)
            ,
            JSON.stringify(expected)
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        let actual = getGraph(parseCode('function foo(x){\n' +
            'x = x +1;\n' +
            'return x;\n' +
            '}'));
        let expected = {'nodes':[{'name':'d0','type':'operation','value':'x = x + 1','options':'green'},{'name':'rd','type':'end','value':'call return','options':'green'},{'name':'r','type':'operation','value':'return x','options':'green'}],'edges':[{'from':'rd','to':'r'},{'from':'d0','to':'rd'},{'from':'d0','to':'rd','dir':'no,right'}],'allNodes':[{'name':'d0','type':'operation','value':'x = x + 1'},{'name':'rd','type':'end','value':'call return'},{'name':'r','type':'operation','value':'return x'},{'name':'d0','type':'operation','value':'x = x + 1'}]};

        assert.deepEqual(
            JSON.stringify(actual)
            ,
            JSON.stringify(expected)
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        let actual = getGraph(parseCode('let y = 1;\n' +
            '\n' +
            'function foo(x){\n' +
            'x = y + x;\n' +
            'return x;\n' +
            '}'));
        let expected = {'nodes':[{'name':'d0','type':'operation','value':'y = 1','options':'green'},{'name':'d1','type':'operation','value':'x = y + x','options':'green'},{'name':'rd','type':'end','value':'call return','options':'green'},{'name':'r','type':'operation','value':'return x','options':'green'}],'edges':[{'from':'rd','to':'r'},{'from':'d1','to':'rd'},{'from':'d1','to':'rd','dir':'no,right'},{'from':'d0','to':'d1'}],'allNodes':[{'name':'d0','type':'operation','value':'y = 1'},{'name':'d1','type':'operation','value':'x = y + x'},{'name':'rd','type':'end','value':'call return'},{'name':'r','type':'operation','value':'return x'},{'name':'d0','type':'operation','value':'y = 1'}]};

        assert.deepEqual(
            JSON.stringify(actual)
            ,
            JSON.stringify(expected)
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        let actual = getGraph(parseCode('let w = 1;\n' +
            '\n' +
            'function foo(x, y, z){\n' +
            '    let a = w + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } \n' +
            '    return c;\n' +
            '}\n'));
        let expected = {'nodes':[{'name':'d0','type':'operation','value':'w = 1','options':'green'},{'name':'d1','type':'operation','value':'a = w + 1\nb = a + y\nc = 0','options':'green'},{'name':'f0','type':'condition','value':'b < z','options':'green'},{'name':'rd','type':'end','value':'call return','options':'green'},{'name':'d2','type':'operation','value':'c = c + 5','options':'red'},{'name':'r','type':'operation','value':'return c','options':'green'}],'edges':[{'from':'rd','to':'r'},{'from':'d2','to':'rd'},{'from':'f0','to':'rd','dir':'no,right'},{'from':'f0','to':'d2','dir':'yes, left'},{'from':'d1','to':'f0'},{'from':'d0','to':'d1'}],'allNodes':[{'name':'d0','type':'operation','value':'w = 1'},{'name':'d1','type':'operation','value':'a = w + 1\nb = a + y\nc = 0'},{'name':'f0','type':'condition','value':'b < z','options':'pass'},{'name':'d2','type':'operation','value':'c = c + 5'},{'name':'rd','type':'end','value':'call return'},{'name':'r','type':'operation','value':'return c'},{'name':'d1','type':'operation','value':'a = w + 1\nb = a + y\nc = 0'}]};

        assert.deepEqual(
            JSON.stringify(actual)
            ,
            JSON.stringify(expected)
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        let actual = getGraph(parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            'let d;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } \n' +
            '    return c;\n' +
            '}\n'));
        let expected = {'nodes':[{'name':'d0','type':'operation','value':'a = x + 1\nb = a + y\nc = 0\nd','options':'green'},{'name':'f0','type':'condition','value':'b < z','options':'green'},{'name':'rd','type':'end','value':'call return','options':'green'},{'name':'d1','type':'operation','value':'c = c + 5','options':'red'},{'name':'r','type':'operation','value':'return c','options':'green'}],'edges':[{'from':'rd','to':'r'},{'from':'d1','to':'rd'},{'from':'f0','to':'rd','dir':'no,right'},{'from':'f0','to':'d1','dir':'yes, left'},{'from':'d0','to':'f0'}],'allNodes':[{'name':'d0','type':'operation','value':'a = x + 1\nb = a + y\nc = 0\nd'},{'name':'f0','type':'condition','value':'b < z','options':'pass'},{'name':'d1','type':'operation','value':'c = c + 5'},{'name':'rd','type':'end','value':'call return'},{'name':'r','type':'operation','value':'return c'},{'name':'d0','type':'operation','value':'a = x + 1\nb = a + y\nc = 0\nd'}]};

        assert.deepEqual(
            JSON.stringify(actual)
            ,
            JSON.stringify(expected)
        );
    });
});
