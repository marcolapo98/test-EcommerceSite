var builder = require('..')
    , chai = require('chai')
    , should = chai.should()
    , fs = require('fs-extra')
    , read = fs.readFileSync;

describe('basic functionality works', function () {

    after(function(done) {
        fs.remove(__dirname + '/fixtures/min');
        fs.remove(__dirname + '/../.tmp', done);
    });

    it('should compile javascript to default location', function (done) {
        var inputFilePath = __dirname + '/fixtures/starting-point.js'
            , outputFilePath = __dirname + '/fixtures/min/starting-point.min.js'
            , fileOptions = {
                input: inputFilePath
            }
            , projectOptions = { path: '.' };

        builder.javascript(fileOptions, projectOptions, function (err) {
            try {
                var expectedContent = read(__dirname + '/results/output.js').toString();
                read(outputFilePath).toString().should.eql(expectedContent);
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });

    it('should compile javascript to overridden output path', function (done) {
        var outputFilePath = __dirname + '/../.tmp/output.js'
            , fileOptions = {
                input: __dirname + '/fixtures/starting-point.js',
                customOutput: outputFilePath
            }
            , projectOptions = { path: '.' };

        builder.javascript(fileOptions, projectOptions, function (err) {
            try {
                var expectedContent = read(__dirname + '/results/output.js').toString();
                read(outputFilePath).toString().should.eql(expectedContent);
                done();
            } catch (ex) {
                done(ex);
            }
        });
    })
});
