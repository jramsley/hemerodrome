describe('foo', () => {
  let baz = 1;

  describe('oof', () => {
    it('meh', () => {
      expect(baz).to.equal(1);
    });

    it('bar', () => {
      baz++;
      console.log('test', baz);

      expect(baz).to.equal(3);
    });
  });
});
