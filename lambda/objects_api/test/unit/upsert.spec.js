import { handler } from '../../src/upsert'
import { __RewireAPI__ as HandlerRewireAPI } from '../../src/upsert'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import sinonTest from 'sinon-test'

const test = sinonTest(sinon);
const should = chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)

function docApiPromise(data) {
  return {promise: () => Promise.resolve(data)}
}

// NOTE WE DO NOT WANT TO TEST LIKE THIS
//
// This is a proof of concept to show that we can unit test lambdas using sinon and rewire.
// In reality, if a lambda is complicated enough to need decent unit test coverage i.e.
// isn't just glue like this one, then the core logic should be separated out and dependencies
// like the dynamodb api should be injected to that testable logic from the lambda.
// The lambda itself just glues the logic in and is only tested by the integration tests.
describe('upsert', function () {

  it('should return created when id present and no previous in db', test(function () {
    // babel-rewire-plugin allows us to access the non exported members of the lambda's module
    // which in turn allows us to mock it and prevent real access to the AWS api
    const mockclient = this.mock(HandlerRewireAPI.__GetDependency__('docClient'))

    const body = {id: 'one', foo: 'bar'}
    process.env.DYNAMO_TABLE = 'FOO'

    mockclient.expects('put')
      .once()
      .withArgs(sinon.match({Item: body, TableName: 'FOO'}))
      .callsFake((params) => docApiPromise({}))

    return handler({body: JSON.stringify(body)}, sinon.fake())
      .should.eventually.deep.equal({
        statusCode: 201,
        headers: {
          Location: '/one'
        },
        body: JSON.stringify(body)})
  }))

  it('should return ok when id present and there is previous in db', test(function () {
      const mockclient = this.mock(HandlerRewireAPI.__GetDependency__('docClient'))

      const body = {id: 'one', foo: 'bar'}
      process.env.DYNAMO_TABLE = 'FOO'

      mockclient.expects('put')
        .once()
        .withArgs(sinon.match({Item: body, TableName: 'FOO'}))
        .callsFake((params) => docApiPromise({Attributes:{id:'one'}}))

      return handler({body: JSON.stringify(body)}, sinon.fake())
        .should.eventually.include({statusCode: 200})
    }))

  it('should return client error when id not present', test(function () {
    const mockclient = this.mock(HandlerRewireAPI.__GetDependency__('docClient'))

    const body = {foo: 'bar'}

    mockclient.expects('put').never()

    return handler({body: JSON.stringify(body)}, sinon.fake())
      .should.eventually.deep.equal({statusCode: 400, body: 'id field is missing'})
  }))

  it('should return client error when id not a string', test(function () {
    const mockclient = this.mock(HandlerRewireAPI.__GetDependency__('docClient'))

    const body = {id: 2, foo: 'bar'}

    mockclient.expects('put').never()

    return handler({body: JSON.stringify(body)}, sinon.fake())
      .should.eventually.deep.equal({statusCode: 400, body: 'id must be a string'})
  }))

  it('should return error if dynamo fails', test(function () {
    const mockclient = this.mock(HandlerRewireAPI.__GetDependency__('docClient'))

    const body = {id: 'one', foo: 'bar'}
    process.env.DYNAMO_TABLE = 'FOO'

    mockclient.expects('put')
      .once()
      .withArgs(sinon.match({Item: body, TableName: 'FOO'}))
      .callsFake((params) => ({promise: () => Promise.reject(new Error('nooo'))}))

    return handler({body: JSON.stringify(body)}, sinon.fake())
      // We don't want to pass through the internal errors since this information leakage
      // can be used in hacking attempts
      .should.be.rejectedWith('Error posting to db')
  }))
})