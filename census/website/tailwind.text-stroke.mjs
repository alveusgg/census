import plugin from 'tailwindcss/plugin';

const flattenColors = colors =>
  Object.entries(colors ?? {}).reduce((acc, [key, value]) => {
    if (key === '__CSS_VALUES__') {
      return acc;
    }

    if (value && typeof value === 'object') {
      Object.entries(flattenColors(value)).forEach(([nestedKey, nestedValue]) => {
        acc[nestedKey === 'DEFAULT' ? key : `${key}-${nestedKey}`] = nestedValue;
      });
    } else {
      acc[key] = value;
    }

    return acc;
  }, {});

const resolveColor = value => (typeof value === 'function' ? value({ opacityValue: 1 }) : value);

const textStroke = plugin(
  ({ addBase, addComponents, matchUtilities, theme }) => {
    const generateShadows = (steps = 1) => {
      const classes = [];

      for (let step = 1; step <= steps; step++) {
        classes.push(
          `0px -${step}px 0px var(--ts-text-stroke-color)`,
          `${step}px -${step}px 0px var(--ts-text-stroke-color)`,
          `${step}px 0px 0px var(--ts-text-stroke-color)`,
          `${step}px ${step}px 0px var(--ts-text-stroke-color)`,
          `0px ${step}px 0px var(--ts-text-stroke-color)`,
          `-${step}px ${step}px 0px var(--ts-text-stroke-color)`,
          `-${step}px 0px 0px var(--ts-text-stroke-color)`,
          `-${step}px -${step}px 0px var(--ts-text-stroke-color)`
        );
      }

      return {
        textShadow: classes.join(','),
        '@supports (-webkit-text-stroke: 1px black) and (paint-order: stroke fill)': {
          textShadow: 'none',
          '-webkit-text-stroke': `${steps * 3}px var(--ts-text-stroke-color)`,
          paintOrder: 'stroke fill'
        }
      };
    };

    addBase({
      ':root': {
        '--ts-text-stroke-color': 'rgb(0, 0, 0)'
      }
    });

    addComponents({
      '.text-stroke': generateShadows()
    });

    matchUtilities(
      {
        'text-stroke': value => ({
          '--ts-text-stroke-color': resolveColor(value)
        })
      },
      {
        values: flattenColors(theme('colors')),
        type: 'color'
      }
    );

    matchUtilities(
      {
        'text-stroke': value => generateShadows(Number(value))
      },
      {
        values: theme('fontStroke'),
        type: 'number'
      }
    );
  },
  {
    theme: {
      fontStroke: {
        1: '1',
        2: '2',
        3: '3',
        4: '4'
      }
    }
  }
);

export default textStroke;
