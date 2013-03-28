#!/bin/env node

assert = require('assert'),request = require('request');

nodes = require('../nodes.json');

nodes = nodes['local'];

okAssert = function(error,response,body){
// error should be null?
    assert.notEqual(error,true,'\n\n **FAIL Error encountered in returned request');
    assert.equal(response.statusCode,200,'\n\n **FAIL \n\n response.statusCode is not 200 \n\n');
    assert.ok(body,'\n\n **FAIL \n\n Returned invalid BODY from request');
    if(typeof response == 'object'){
        console.log('\n\n**okAssert Passed**\n');

    }else if(response == 'array'){
        console.log('\n\n**okAssert Passed**\n');

    }else{
        console.log('\n\n**okAssert Passed**\n');
    }
    
    console.log(response.statusCode);
    console.log(body);

}
// make sure specific values (invalid) return 404
failAssert = function(error,response,body){
    //assert.ok(error,'\n\n **FAIL in failAssert - error was NOT encountered.')
    assert.notEqual(response.statusCode,200,'\n\n **FAIL in failAssert - response.statusCode was equal to 200.');
    console.log('\n\n**failAssert Passed**\n')
    console.log(response.statusCode);
    console.log(body);

}
notContainedAssert = function(error,response,body){
    body = JSON.parse(body);
    assert.equal(body[1],0,'\n\n**FAIL\n\nInvalid ID matched in notContained');
}

