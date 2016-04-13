node-file-builder
=================
> A file builder ripped from the insides of PrePros

# Why?
Concatenate files with prepend and append directives embedded in the files as is possible in PrePros and CodeKit.
This tool was made to serve the needs of
[grunt-codekit](https://github.com/fatso83/grunt-codekit), but is published in
the hopes that it meets the needs of other souls out there.

# Getting started

```
var builder = require('file-builder')
            , fileOptions = {
                input: 'starting-point.js',
                customOutput: '../results/output.js'
            }
            , projectOptions = { path: '.' };

builder.javascript(fileOptions, projectOptions, callback);
```

Assuming we are working with the files in the
[test/fixtures](https://github.com/fatso83/node-file-builder/tree/master/test/fixtures)
directory you will end up with
[test/results/output.js](https://github.com/fatso83/node-file-builder/tree/master/test/results/output.js)

# API notes
We are just working directly with the innards of Prepros, so if you want
to know about *all* the different overrides you can look into the `config`
module of PrePros.

## Javascript 

### Appending 
Use single line comments with `@codekit-append` or `@prepros-append`  
Example: `// @codekit-append 'myfile.js'`

### Prepending

See *Appending* - substitute keywords for `@codekit-prepend`, `@prepros-prepend`

### API

`javascript(fileOptions, projectOptions, callback)`

- *fileOptions.input* (compulsory) name of input file
- fileOptions.config.customOutput Filename of specific outputfile
- fileOptions.config.uglify
- fileOptions.config.sourcemaps
- fileOptions.config.mangle
- *projectOptions.path* (compulsory) must be set to .
- callback if the first argument is non-null, an error has occurred. Second argument is name of the input file

## Ruby, SASS, ... 

We are embedding the core of PrePros, so one could do a lot more, but the goal for the first version was to expose the javascript functionality. Feel free to push a PR.

# Notes

There are some more newlines than what one might expect, but this is
how Prepros does this, and so any issues with that should be filed
in the Prepros project.

# About
The actual file concatenation logic has been ripped from the insides
of PrePros, so thanks to [Subash Pratakh](http://github.com/subash)  for releasing those parts under the MIT
license.

# Problems? Pull requests?
File an issue if there are problems. Pull requests are very welcome.
