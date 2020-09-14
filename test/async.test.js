describe('afoo', async () => {
  await describe('abar', async () => {

    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('here');
  });

  await describe('bbar', async () => {
    console.log('bbar');
  });
});
