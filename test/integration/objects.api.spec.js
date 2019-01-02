import { assert } from "chai"
import * as fs from 'fs';

describe("objects", function () {
  let objectsUrl

  before(function (done) {
    fs.readFile('./terraform_outputs.json', 'utf8', function(err, fileContents) {
      if (err) {
        throw err
      } else {
        const terraform = JSON.parse(fileContents)
        objectsUrl = terraform.root_url + terraform.objects_path
        console.log("URL " + objectsUrl)
      }

      done()
    })
  })

  it("tortoiseology", function () {
    assert.ok(true)
  })
})