const source =
  `Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n Proin a accumsan nisl.\n Nam quam massa, sodales et nunc id, finibus vehicula neque.\n Aenean malesuada lacus eget arcu placerat, id bibendum odio eleifend.\n Nullam ultrices tellus arcu.\n Vivamus pellentesque porta purus id sollicitudin.\n Ut eget facilisis mi, ac vestibulum ipsum.\n Cras gravida vestibulum erat.\n Vivamus consectetur turpis vitae sem sodales, commodo luctus nibh iaculis.\n Vivamus porta sit amet ligula a molestie.\n Aliquam facilisis risus et magna egestas ultricies.\n Integer nec nisl dignissim, blandit lacus vel, gravida sapien.\n Ut sit amet libero sollicitudin, elementum sapien eget, placerat arcu.\n Integer vel turpis finibus, fringilla quam quis, accumsan urna.\n Proin dapibus sapien eu eros venenatis mattis.\n`
    .split('\n')
    .map(line => line.trim());

export const lorum = (lines: number) => {
  return source.slice(0, lines).join(' ');
};
