RR.scene({ id: 'test_people', order: 1, dur: 4, draw(t) {
  const roles = ['de', 'fr', 'ar', 'hu'];
  roles.forEach((r, i) => {
    const x = 260 + i * 460, y = 520;
    RR.shadow(x, y, 80, 14);
    RR.drawPerson(r, x, y, 1.5, { ...RR.personIdle(t, i), prop: RR.PEOPLE[r].prop, armR: RR.PEOPLE[r].prop === 'binoculars' ? 2.6 : 0.9, armL: RR.PEOPLE[r].prop === 'binoculars' ? 2.6 : 0.2, mouth: ['smile', 'grin', 'open', 'flat'][i], brow: ['neutral', 'sly', 'up', 'angry'][i] });
  });
  const poses = [
    { armL: 2.8, armR: 2.8, mouth: 'grin', eyes: 'happy' },
    { armL: -0.6, armR: 1.4, mouth: 'talk', talkT: t, prop: 'card' },
    { armR: 2.2, prop: 'trophy', mouth: 'grin' },
    { armL: 0.3, armR: 1.2, prop: 'cube', cubeRole: 'fr', eyes: 'wide', mouth: 'o' },
  ];
  poses.forEach((p, i) => {
    const x = 260 + i * 460, y = 1040;
    RR.shadow(x, y, 80, 14);
    RR.drawPerson(roles[i], x, y, 1.5, { ...RR.personIdle(t, i), ...p });
  });
}});
