import chai from "chai"
import * as chakram from "chakram"
import * as fs from 'fs'

const should = chai.should()

describe("objects api", function () {
  let objectsUrl

  before(function (done) {
    fs.readFile('./terraform_outputs.json', 'utf8', function(err, fileContents) {
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
    let createResp, firstGetResp, updateResp, secondGetResp, deleteResp, thirdGetResp

    before("do a create, get, update, get, delete, get of the same id", function(){
      return chakram.post(objectsUrl, {id:"cauliflower", baz: 2})
        .then((resp) => {
          createResp = resp.response
          return chakram.get(objectsUrl+"?id=cauliflower")
        })
        .then((resp) => {
          firstGetResp = resp.response
          return chakram.post(objectsUrl, {id:"cauliflower", baz: 9})
        })
        .then((resp) => {
          updateResp = resp.response
          return chakram.get(objectsUrl+"?id=cauliflower")
        })
        .then((resp) => {
          secondGetResp = resp.response
          return chakram.delete(objectsUrl+"?id=cauliflower")
        })
        .then((resp) => {
          deleteResp = resp.response
          return chakram.get(objectsUrl+"?id=cauliflower")
        })
        .then((resp) => {
          thirdGetResp = resp.response
        })
    })

    it("should return the sent body", function () {
      createResp.body.should.deep.equal({id:"cauliflower", baz: 2})
    })

    it("should return created", function () {
      createResp.statusCode.should.equal(201)
    })

    describe("Retrieving after create", function(){

      it("should return success", function () {
        firstGetResp.statusCode.should.equal(200)
      })

      it("should return the originally posted body", function () {
        firstGetResp.body.should.deep.equal({id:"cauliflower", baz: 2})
      })
    })

    describe("Updating after create", function(){

      it("should return success", function () {
        updateResp.statusCode.should.equal(201)
      })

      it("should return the updated body", function () {
        updateResp.body.should.deep.equal({id:"cauliflower", baz: 9})
      })
    })

    describe("Retrieving after update", function(){

      it("should return success", function () {
        secondGetResp.statusCode.should.equal(200)
      })

      it("should return the originally posted body", function () {
        secondGetResp.body.should.deep.equal({id:"cauliflower", baz: 9})
      })
    })

    describe("Deleting the item", function(){

      it("should return success", function () {
        deletResp.statusCode.should.equal(200)
      })

      it("should return the previous body", function () {
        deleteResp.body.should.deep.equal({id:"cauliflower", baz: 9})
      })
    })

    describe("Retrieving after delete", function(){

      it("should return not found", function () {
        thirdGetResp.statusCode.should.equal(404)
      })
    })
  })
})