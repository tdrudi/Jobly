const {sqlForPartialUpdate} = require("./sql");

describe("sqlForPartialUpdate", function(){
    test("test: update 1 value", function(){
        const res = sqlForPartialUpdate(
            {field1: "val1"},
            {field1:"field1", field2 : "field2"})
        expect(res).toEqual({
            setCols: "\"field1\"=$1",
            values: ["val1"],
        });
    });

    test("test: update 2 values", function(){
        const res = sqlForPartialUpdate(
            {field1: "val1", field2: "val2"},
            {field2 : "field2"})
        expect(res).toEqual({
            setCols: "\"field1\"=$1, \"field2\"=$2",
            values: ["val1", "val2"],
        });
    });
});