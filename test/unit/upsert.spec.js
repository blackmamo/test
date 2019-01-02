import { handler } from "../../src/upsert"
import { __RewireAPI__ as HandlerRewireAPI } from "../../src/upsert"
import chai from "chai";
import sinon from "sinon"
import sinonChai from "sinon-chai"

const should = chai.should()
chai.use(sinonChai)

describe("upsert", function () {

  it("should return created when Id present", function (done) {
    const mockdb = sinon.mock(HandlerRewireAPI.__GetDependency__('dynamodb'))

    const body = {id: 1, foo: "bar"}

    mockdb.expects("putItem")
      .once()
      .withArgs(sinon.match(body))
      .callsFake((params, callback) => {callback(null,{success:"yay"})})

    const callback = (err, data) => {
      should.not.exist(err)
      data.should.be.deep.equal({statusCode: 201, body: JSON.stringify(body)})
      done()
    }

    handler({body: JSON.stringify(body)}, sinon.fake() ,callback)
  })

  it("should return client error when Id not present", function (done) {
      const mockdb = sinon.mock(HandlerRewireAPI.__GetDependency__('dynamodb'))

      const body = {foo: "bar"}

      mockdb.expects("putItem")
        .once()
        .withArgs(sinon.match(body))
        .callsFake((params, callback) => {callback(null,{success:"yay"})})

      const callback = (err, data) => {
        should.not.exist(err)
        data.should.be.deep.equal({statusCode: 400, body: "Id is missing"})
        done()
      }

      handler({body: JSON.stringify(body)}, sinon.fake() ,callback)
    })

  it("should return error if dynamo fails", function (done) {
      const mockdb = sinon.mock(HandlerRewireAPI.__GetDependency__('dynamodb'))

      const body = {id: 1, foo: "bar"}

      mockdb.expects("putItem")
        .once()
        .withArgs(sinon.match(body))
        .callsFake((params, callback) => {callback(new Error("nooo"), null)})

      const callback = (err, data) => {
        err.should.be.deep.equal(new Error("nooo"))
        should.not.exist(data)
        done()
      }

      handler({body: JSON.stringify(body)}, sinon.fake() ,callback)
    })

  afterEach(() => {
    // Restore the default sandbox here
    sinon.restore()
  });
})