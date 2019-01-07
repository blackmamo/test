import chai from "chai"
import * as chakram from "chakram"
import * as fs from 'fs'

var expect = chakram.expect;

function getLocation(response){
  return response.response.headers.location
}

describe("objects api", function () {
  this.timeout(15000)
  let objectsUrl

  before(function (done) {
    fs.readFile('../../terraform_outputs.json', 'utf8', function(err, fileContents) {
      if (err) {
        throw err
      } else {
        const terraform = JSON.parse(fileContents)
        objectsUrl = terraform.root_url + terraform.objects_path
      }
      done()
    })
  })

  describe("CRUD operations", function(){

    describe("Create", function(){
      let response

      before("Do the create", function(){
        return chakram.post(objectsUrl, {id:"cauliflower", baz: 2})
          .then(resp => response = resp )
      })

      it("should return the sent body", function () {
        expect(response).to.comprise.of.json({id:"cauliflower", baz: 2})
      })

      it("should return created", function () {
        expect(response).to.have.status(201)
      })

      it("should return resource location", function () {
        expect(response).to.have.header("Location","/cauliflower")
      })

      it("should be observable (in subsequent get)", function () {
        return chakram.get(objectsUrl + getLocation(response))
          .then(resp => expect(resp).to.comprise.of.json({id:"cauliflower", baz: 2}))
      })

      after("Cleanup resource", function(){
        return chakram.delete(objectsUrl + getLocation(response))
      })
    })

    describe("Update", function(){
      let response

      before("Do a create and then update", function(){
        // initial create, followed by an update
        return chakram.post(objectsUrl, {id:"broccoli", bar: 2})
          .then(() => chakram.post(objectsUrl, {id:"broccoli", bar: 10}))
          .then(resp => response = resp)
      })

      it("should return the sent body", function () {
        expect(response).to.comprise.of.json({id:"broccoli", bar: 10})
      })

      it("should return ok", function () {
        expect(response).to.have.status(200)
      })

      it("should return resource location", function () {
        expect(response).to.have.header("Location","/broccoli")
      })

      it("should be observable (in subsequent get)", function () {
        return chakram.get(objectsUrl + getLocation(response))
          .then(resp => expect(resp).to.comprise.of.json({id:"broccoli", bar: 10}))
      })

      after("Cleanup resource", function(){
        return chakram.delete(objectsUrl + getLocation(response))
      })
    })

    describe("Delete", function(){
      let createResp, response

      before("Do a create and then update", function(){
        // initial create, followed by an update
        return chakram.post(objectsUrl, {id:"kholrabi", bob: "ross"})
          .then(resp => {
            createResp = resp
            return chakram.delete(objectsUrl + getLocation(resp))
          })
          .then(resp => response = resp)
      })

      it("should return the old body", function () {
        expect(response).to.comprise.of.json({id:"kholrabi", bob: "ross"})
      })

      it("should return ok", function () {
        expect(response).to.have.status(200)
      })

      it("should not have location header", function () {
        expect(response).to.not.have.header("Location")
      })

      it("should not be observable (404 in subsequent get)", function () {
        return chakram.get(objectsUrl + getLocation(createResp))
          .then(resp => expect(resp).to.have.status(404))
      })

      after("Cleanup resource", function(){
        return chakram.delete(objectsUrl + getLocation(createResp))
      })
    })
  })
})