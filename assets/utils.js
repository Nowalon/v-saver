
class Utils {
  constructor() {}

  testUtilsMethod() {
    return {test: 'Test-testUtilsMethod'};
  }

  handleAwait(promise) {
    return promise.then(data => ({
      ok: true,
      data
    })).catch(error => Promise.resolve({
      ok: false,
      error
    }));
  }

}

module.exports = new Utils();
