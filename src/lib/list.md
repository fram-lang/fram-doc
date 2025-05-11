# List

The list module implements a multitude of list methods and functions. 

## Avaible methods

---
`isEmpty xs ('a List -> Bool)` - is xs an empty list

---
`length xs ('a List -> Int)` - number of elements in xs

---
`hd xs ('a List  -> 'a Option)` - Head of xs in Some if xs isn't empty, None otherwise

---
`hdErr onError xs (( () -> 'a) -> 'a List -> 'a)` - Head of xs if xs isn't empty, onError () otherwise

---
`tl xs ('a List -> 'a)` -> Tail of xs in Some if xs isn't empty, None otherwise

---
`tlErr onError xs (( () -> 'a) -> 'a List -> 'a)` - Tail of list if list isn't empty, onError () otherwise

---
`nth xs n ('a List -> Int -> 'a)` -
nth element (0-indexed) of xs in Some if xs has at least n+1 elements, None otherwise

---
`nthErr onError xs n ( (()  -> 'a) -> 'a List -> Int -> 'a)` - nth element (0-indexed) of xs if xs has at least n+1 elements, onError () otherwise

---
`append xs ys ('a List -> 'a List -> 'a List)` -
all elements of xs followed by all elements of ys, in the same order as in the original lists

---
`revAppend xs acc ('a List -> 'a List -> 'a List)` - all elements of xs followed by all elements of ys, with xs reversed and ys kept intact

---
`rev xs ('a List -> 'a List)` - reversed xs

---
`concat xss (list 'a List -> 'a List)` - flattens xss, order is preserved

---
`map f xs (('a -> 'b) -> 'a List -> 'b List)` - list of (f x) 

---
`mapi f xs (('a -> Int -> 'b) -> 'a List -> 'b List)` - list of (f i x), where i is the 0-indexed position of x in xs

---
`map2 onError f xs ys ( ( () -> 'c) -> ('a -> 'b -> 'c ) -> 'a List -> 'b List -> 'c List)` - list of (f x y). If lists are not of equal size, list ends with onError () after the shorter argument list is exhausted.

---
`revMapAppend f xs ys (('a -> 'b) -> 'a List -> 'b List -> 'b List)` - Produces the same result as (revAppend (map f xs) ys) but more efficiently

---
`revMap f xs (('a -> 'b) -> 'a List -> 'b List)` - Produces the same result as (rev (map f xs)) but more efficiently

---

`revMap2 onError f xs ys ((() -> 'c) -> ('a -> 'b -> 'c) -> 'a List -> 'b List -> 'c List)` - Produces the same results as (rev (map2 onError f xs ys)) but more efficiently

---
`filter p xs (('a -> Bool) -> 'a List -> 'a List)` - list of all elements x in xs for which (p x) is true

---
`filteri p xs (('a -> Int -> Bool) -> 'a List -> 'a List)` - list of all elements x in xs for which (f i x) is true, where i is the 0-indexed position of x in xs

---
`filterMap f xs (('a -> Option 'b) -> 'a List)` - List of values of (f x) that are (Some y), unboxed. None values are omitted from the result.

---
`concatMap f xs (('a -> 'b List) -> 'a)` - short for `(concat (map f xs))`

---
`take n xs (Int -> 'a List -> 'a List)` - the n-long prefix of xs or xs, whichever is shorter

---
`drop n xs (Int -> 'a List -> 'a List)` - xs without the fist n elements

---
`takeWhile p xs (('a -> Bool) -> 'a List -> 'a List)` - the longest prefix of xs in which for all elements x, (p x) = true

---
`dropWhile p xs (('a -> Bool) -> 'a List -> 'a List)` - the suffix of xs starting at the first element of xs for which (p x) = false

---
`iter f xs (('a -> 'b) -> 'a List -> ())` - does (f x)on all elements of xs

---
`iteri f xs (('a -> Int -> 'b) -> 'a List -> ())` - does (f i x) on all elements of xs, where i is the 0-indexed position of x in xs

---
`iter2 onError f xs ys (( () -> () ) -> ('a -> 'b -> 'c) -> 'a List -> 'b List -> ())` - 
does (f x y) on all elements of xs and ys. If xs and ys are not of equal length, does (onError ()) after the shorter list is consumed

---
`init len f (Int -> (Int -> 'a) -> 'a List)` - list of len elements (f i), where i is the 0-indexed position of (f i) in the list

---
`foldLeft f acc xs (('a -> 'b -> 'a) -> 'a -> 'b List)` - everyone knows what a foldLeft is

---
`foldRight f xs acc (('a -> 'b -> 'b) -> 'a List -> 'b)` - just a normal foldRight

---
`foldLeft2 onError f acc xs ys (( () -> 'a) -> ('a -> 'b -> 'c -> 'a) -> 'a -> 'b List -> 'c List -> 'a)` - onError () if lists are of different lengths, just a normal foldLeft2 otherwise

---
`foldRight2 onError f xs ys acc ( ( () -> 'c) -> ('a -> 'b -> 'c -> 'c) -> 'a List -> 'b List -> 'c)` -
onError () if lists are of different lengths, just a normal foldRight2 otherwise

---
`forAll p xs (('a -> Bool)-> 'a List)` - true if (p x) is true for all elements x in xs, false otherwise

---
`forAll2 onError p xs ys (( () -> Bool) -> ('a -> 'b -> Bool) -> 'a List -> 'b List -> Bool)` - true if (p x y) is true for all pairs of elements at equal positions in xs and ys, false otherwise. If lists are of unequal length, the logical and of the result and (onError ()) will be returned

---
`exists p xs (('a -> Bool) -> 'a List) -> Bool` - true if (p x) is true for any x in xs, false otherwise

---
`exists2 onError p xs ys (( () -> Bool) -> ('a -> 'b -> Bool) -> 'a List -> 'b List -> Bool)` - true if (p x y) is true for any pair of elements at equal positions in xs and ys, false otherwise. If lists are of unequal length, the logical or of the result and (onError ()) will be returned.

---
`find p xs (('a -> Bool)-> 'a List -> 'a Option)` - (Some x) of the first element x in xs for which (p x) is true if such an element exists, None otherwise

---
`findErr onError p xs (( () -> 'a) -> ('a -> Bool) -> 'a List)` - The first element x in xs for which (p x) is true if such an element exists, None otherwise

---
`findIndex p xs ((p 'a) -> 'a List -> Int Option)` -(Some i) where i is the 0-indexed position of the first element x in xs for which (p x) is true if such an element exists, None otherwise

---
`findIndexErr onError p xs ( ( () -> Int) -> ('a -> Bool) -> 'a List -> Int)` - The 0-indexed position of the first element x in xs for which (p x) is true if such an element exists, onError otherwise

---
`findMap f xs (('a -> 'b Option) -> 'a List -> 'b Option)` - The (f x) of the first element x in xs for which (f x) is Some. None if no such x exists

---
`findMapErr onError f xs (( () -> 'a) -> ('b -> Option 'a) -> 'b List -> 'a)` - The unboxed (f x) of the first element x in xs for which (f x) is Some. (onError ()) if no such x exists.

---
`findMapi f xs ((Int -> 'a -> 'b Option) -> 'a List -> 'b Option)` - The (f i x) of the first element x in xs for which (f i x) is Some, where i is the 0-indexed position of x in xs, or None if no such x exists

---
`findMapiErr onError f xs ( ( () -> 'a) -> (Int -> 'b -> 'a Option) -> 'b List -> 'a)` - The unboxed (f i x) of the first element x in xs for which (f i x) is some, where i is the 0-indexed position of x in xs, or (onError ()) otherwise

---
`foldLeftMap f acc xs (('a -> 'b -> ('a, 'c)) -> 'a -> 'b List -> ('a, 'c List))` - Processes list from start to end, returning a pair of the final accumulator (from the first value of (f acc x)) and a list of the second values of (f acc x).

---
`foldLeftFilterMap f acc xs (('a -> 'b -> ('a, 'c) Option) -> 'a -> 'b List -> ('a, 'c List))` - Like foldLeftMap, but elements for which (f acc x) is None are completely ignored which elements for which it is Some are unboxed. Equivalent to foldLeftMap if f always returns Some.

---
`foldLeftConcatMap f acc xs (('a -> 'b -> ('a, 'c List)) -> 'a -> 'b List -> ('a, 'c List))` - A pair of the first value of foldLeftMap f acc xs and concat of it's second value

---
`mem v xs (E -> List E -> Bool)` - True if xs contains x, false otherwise. E must have an 'equal' method.

---
`equal xs ys ((List E) -> (List E) -> Bool)` - Element-wise equality on lists. E must have an 'equal' method. False if lists are of different lengths.