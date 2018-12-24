import $ from 'jquery';
import {parseCode, getGraph} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        getGraph(parsedCode);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    });
});
