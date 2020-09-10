describe('foo', () => {
  let baz = 1;

  describe('oof', () => {
    it('bar', () => {
      baz++;
      console.log('test', baz);
    });
  });
});
