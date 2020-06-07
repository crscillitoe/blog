<h1 align="center">Creating my First CTF Challenge</h1>

Picture this: you've been asked to create a challenge for an upcoming CTF.

- But in this scenario, you're not you, you're me.

You know what that means: absuridity is the only valid approach.

In case you are a new reader, I will direct your attention towards one of

- [my](https://github.com/crscillitoe/isOdd)
- [many](https://github.com/crscillitoe/EnterpriseOddVerifier)
- [absurd](https://github.com/crscillitoe/MemeGAN)
- [projects](https://github.com/crscillitoe/FintechTM).

I had designed cute riddles that would lead
my victims to these memory addresses. This
would allow them to construct some HolyC code
that prints them out, thus allowing them to
reverse engineer the hash. Since TempleOS doesn't
restrict addressabe memory, my code ended up looking like this:

```C
0xFFFF     = "25lZF91c30\0";
0xAAEDA    = "V1BJe3doe\0";
0xBDAECA   = "V9oYXNfZ29\0";
0x3a28213a = "kX2FiYW5kb\0";
```

- Note: This code has been heavily shortened for brevity.
  You can view the original image of the code [here](https://images.woohoojin.dev/🍑👀💦️️🧢🚔👀💩👀😳💦👀💦💦💦🚨🍑💩👀.png).
