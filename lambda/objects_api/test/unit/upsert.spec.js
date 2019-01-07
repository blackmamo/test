import { handler } from "../../src/upsert"
import { __RewireAPI__ as HandlerRewireAPI } from "../../src/upsert"
import chai from "chai"
import sinon from "sinon"
import sinonChai from "sinon-chai"
import sinonTest from 'sinon-test'

const test = sinonTest(sinon);
const should = chai.should()
chai.use(sinonChai)

// NOTE WE DO NOT WANT TO TEST LIKE THIS
//
// This is a proof of concept to show that we can unit test lambdas using sinon and rewire.
// In reality, if a lambda is complicated enough to need decent unit test coverage i.e.
// isn't just glue like this one, then the core logic should be separated out and dependencies
// like the dynamodb api should be injected to that testable logic from the lambda.
// The lambda itself just glues the logic in and is only tested by the integration tests.
describe("upsert", function () {

  it("should return created when Id present", test(function (done) {
    // babel-rewire-plugin allows us to access the non exported members of the lambda's module
    // which in turn allows us to mock it and prevent real access to the AWS api
    const mockclient = this.mock(HandlerRewireAPI.__GetDependency__('docClient'))

    const body = {id: "one", foo: "bar"}
    process.env.DYNAMO_TABLE = "FOO"

    mockclient.expects("put")
      .once()
      .withArgs(sinon.match({Item: body, TableName: "FOO"}))
      .callsFake((params, callback) => {callback(null,{success:"yay"})})

    const callback = (err, data) => {
      should.not.exist(err)
      data.should.be.deep.equal({statusCode: 201, body: JSON.stringify(body)})
      done()
    }

    handler({body: JSON.stringify(body)}, sinon.fake() ,callback)
  }))

  it("should return client error when id not present", test(function (done) {
    const mockclient = this.mock(HandlerRewireAPI.__GetDependency__('docClient'))

    const body = {foo: "bar"}

    mockclient.expects("put").never()

    const callback = (err, data) => {
      should.not.exist(err)
      data.should.be.deep.equal({statusCode: 400, body: "id field is missing"})
      done()
    }

    handler({body: JSON.stringify(body)}, sinon.fake() ,callback)
  }))

  it("should return client error when id not a string", test(function (done) {
    const mockclient = this.mock(HandlerRewireAPI.__GetDependency__('docClient'))

    const body = {id: 2, foo: "bar"}

    mockclient.expects("put").never()

    const callback = (err, data) => {
      should.not.exist(err)
      data.should.be.deep.equal({statusCode: 400, body: "id must be a string"})
      done()
    }

    handler({body: JSON.stringify(body)}, sinon.fake() ,callback)
  }))

  it("should return error if dynamo fails", test(function (done) {
    const mockclient = this.mock(HandlerRewireAPI.__GetDependency__('docClient'))

    const body = {id: "one", foo: "bar"}
    process.env.DYNAMO_TABLE = "FOO"

    mockclient.expects("put")
      .once()
      .withArgs(sinon.match({Item: body, TableName: "FOO"}))
      .callsFake((params, callback) => {callback(new Error("nooo"), null)})

    const callback = (err, data) => {
      // We don't want to pass through the internal errors since this information leakage
      // can be used in hacking attempts
      err.message.should.be.deep.equal("Error posting to db")
      should.not.exist(data)
      done()
    }

    handler({body: JSON.stringify(body)}, sinon.fake() ,callback)
  }))
})