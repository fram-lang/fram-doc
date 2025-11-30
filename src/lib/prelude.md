# Prelude

The `Prelude` module is automatically imported and opened in all programs.

### Available functions:

---
`flip f` returns function with flipped arguments

`flip f x y = f y x`

---
`fst p` returns first element of a pair `p`

`fst (x, _) = x`

---
`snd p` returns second element of a pair `p`

`snd (_, y) = y`

---
`not b` negates boolean value `b`

---
`charListToStr xs` converts list of characters `xs` into `String`

---
`chr n` converts integer `n` to corresponding ASCII character (`0 <= n <= 256` to work properly)

---
`printStrLn`

---
`printStr`

---
`printInt` prints integer

---
`readLine` reads line of input, returns `String`

---
`exit`
