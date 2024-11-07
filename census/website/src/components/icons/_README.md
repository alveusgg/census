This is a custom, not open source icon set that should be the preferred icon set for projects.
To see all of the icons and search for specific ones see here: https://iconic.app

## How to use

1. Go to https://iconic.app and search for the icon you want
2. Note the name of the icon, e.g. `a-z-sort` or `battery-charging`.
3. Import the icon from this folder into your component, e.g. `import SiAZSort from '@/icons/SiYen';` or `import SiBatteryCharging from '@/icons/SiBatteryCharging';`
4. Use the icon in your component, e.g. `<SiAZSort />` or `<SiBatteryCharging />`. It's just a svg component under the hood so you can control it in anyway you would any other svg component. I recommend changing the size of the icon by using font-size, e.g. `<SiAZSort className="text-xl" />`. This means it'll be more consistent with the rest of the app and you can change the size of all icons at once by changing the font-size of the parent element.
