import chai from "chai"
import * as chakram from "chakram"
import * as fs from 'fs'

var expect = chakram.expect;

function getLocation(response){
  return response.response.headers.location
}

describe("front end", function () {
  let url

  before(function (done) {
    fs.readFile('../../terraform_outputs.json', 'utf8', function(err, fileContents) {
      if (err) {
        throw err
      } else {
        const terraform = JSON.parse(fileContents)
        url = terraform.front_end_url
      }
      done()
    })
  })

  it("should be able to access front end", function () {
    return chakram.get("http://"+url)
      .then(resp => {
        expect(resp).to.have.status(200)
        expect(resp).to.have.header("content-type", "text/html")
        return chakram.wait()
      })
  })
})