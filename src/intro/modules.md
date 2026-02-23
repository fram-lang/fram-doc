# Modules

Modules in Fram provide a way to organize code in a hierarchical manner.
Each module can be thought of as a namespace that contains related functions,
types, methods, values, and other modules. Modules avoid name clashes, improve
readability, and allow implementation details to remain hidden.

## Basics

To define a module, just use the `module` keyword followed by the module name
(which must start with an uppercase letter) and a block of definitions
ended with the `end` keyword. Definitions marked with the `pub` keyword become
public members of the module, and thus accessible from the outside. On the
other hand, definitions without the `pub` keyword are private to the module.

```fram
module Vec2D
  pub data Vec2D = { x : Int, y : Int }

  let sqr (x : Int) = x * x

  pub let lengthSq (v : Vec2D) =
    sqr v.x + sqr v.y
end
```

In the example above, the `Vec2D` module defines a public data type `Vec2D`
and a public function `lengthSq`, while the helper function `sqr` is private
to the module. To access the public members from outside the module, you can
use the module name as a prefix.

```fram
let longerThan (v1 : Vec2D.Vec2D) (v2 : Vec2D.Vec2D) =
  Vec2D.lengthSq v1 > Vec2D.lengthSq v2
```

Alternatively, you can open the module to bring its public members into the
current scope. Opening a module is another kind of definition, so it can
be done at the top level or in a block of local definitions, ended as usual
with the `in` keyword.

```fram
let foo v =
  open Vec2D in
  lengthSq v + 1

open Vec2D

let bar v =
  lengthSq v + 2
```

## Nested Modules

Modules can be nested inside other modules to create a hierarchy of namespaces.
Modules, as other definitions, can be public (marked with `pub`) or private to
the enclosing module.
```fram
module M
  module PrivateModule
    pub let hiddenFunction () = 42
  end
  pub module PublicModule
    pub let visibleConstant = PrivateModule.hiddenFunction ()
  end
end

let x = M.PublicModule.visibleConstant
```

## Modules and Files

Each file corresponds to a module, that contains all the public definitions
in that file. To access such modules from other files, they must be imported
using the `import` pragma at the top of the file. For instance, to access the
functions defined in the `List` module (which is a part of the standard
library), you would write the following.

```fram
import List

let myList = List.map (fn (x : Int) => x + 1) [1, 2, 3]
```

In order to avoid name clashes, when importing a module from a file it is
possible to rename it using the `as` keyword.

```fram
import List as L
```

Moreover, it is possible to open a module when importing it, so that its public
members are directly accessible without the module prefix.

```fram
import open List
```

## File Hierarchy

Fram supports organizing files in directories, and each file still corresponds
to a module. To import a file in a more complex directory structure, you can
provide the path (without the `.fram` extension) to the file using slashes
(`/`) to separate directories. For example, consider the following file
structure.

```
Math/
  Basics.fram
  Algebra.fram
  Geometry/
    Vec2D.fram
    Vec3D.fram
  Logic/
    FOL.fram
Main.fram
```

For example, in the `Main.fram` file, you can import the `Vec2D` module, by
typing `import Math/Geometry/Vec2D`, the imported module will be named `Vec2D`
by default, but you can rename it using the `as` keyword.

### Absolute Paths

In order to avoid ambiguity when importing modules, Fram supports absolute
paths. If a module path starts with a slash (`/`), it is considered absolute.
If the absolute path starts with `/Main/` it is considered to be relative to
the project root directory, otherwise it is considered to be relative to the
Fram library installation directories. In the example above, the virtual
structure of available modules would be as follows.

```
Main/
  Math/
    Basics
    Algebra
    Geometry/
      Vec2D
      Vec3D
    Logic/
      FOL
  Main
List
... (other standard library modules)
```

Thus, to import the `Vec2D` module using an absolute path, you would write
`import /Main/Math/Geometry/Vec2D`. All standard library modules can be
imported using absolute paths starting with a single slash, for example,
`import /List`, `import /String`, etc.

### Relative Paths

Paths to modules are relative if they do not start with a slash (`/`).
Relative paths are resolved, by trying to add all possible prefixes of the
path to the current module path. For example, if the `Algebra` module tries to
import `Geometry/Vec2D`, the following paths will be tried in order.
- `/Main/Math/Geometry/Vec2D`
- `/Main/Geometry/Vec2D`
- `/Geometry/Vec2D`

If multiple modules with the same name exist in different directories, the
first one found using the above strategy will be used. This resolution
strategy allows modules to be moved around in the directory structure without
breaking imports, as long as the relative structure is preserved.

## Member Visibility

Each definition inside a module can be marked as public using the `pub`
keyword. Definitions that are not marked with anything are considered private,
and can only be accessed from within the module itself. Sections and blocks of
mutually recursive definitions can also be marked with the `pub` keyword,
making all definitions inside them public. In the example below, all
definitions inside the `section` and `rec` blocks are public members of the
module.

```fram
pub section
  let x = 42
  let y = x + 1
end

pub rec
  let odd (n : Int) =
    if n == 0 then False else even (n - 1)
  let even (n : Int) =
    if n == 0 then True else odd (n - 1)
end
```

When multiple bindings are defined in a single `let` binding via
pattern-matching, the `pub` keyword makes all of them public. For more
fine-grained control over visibility of such variables, you can mark
any subpattern as public using the `pub` keyword before it. In particular,
the `pub` keyword can be used before variable names in patterns.

```fram
let (pub foo, bar) =
  ((fn (x : Int) => x + 1), (fn () => (1, (2, 3))))
let (x, pub (a, b)) = bar ()
let pub c = bar ()
```

In the above example, the variables `foo`, `a`, `b`, and `c` are public
members of the module, while `bar` and `x` are private. The last line is
technically correct, but it is not recommended to use `pub` in this way.
Using pub inside patterns makes visibility harder to see and reason about,
especially in large bindings. Prefer separate pub let definitions for clarity.

### Abstract Members

In addition, definitions of data types can be marked as `abstr`, which means
that the type itself is public, but its constructors are private to the module.

```fram
module Counter
  abstr data Counter = Counter of Int
  pub let make = Counter 0
  pub method inc (Counter n) = Counter (n + 1)
  pub method get (Counter n) = n
end
```

In the example above, the `Counter` type is public, but its constructor is
private. Attempting to construct or pattern-match on an abstract constructor
outside its defining module results in a compile-time error. However, the user
can create counters using the `make` function, and manipulate them using the
provided methods.

### Including Modules

The `pub` keyword has a special meaning when it is used before an `open`
statement. In such a case, all public members of the opened module are
re-exported as public members of the current module. In case of name clashes,
the last definition (either defined directly in the module or imported from
another module) takes precedence.

```fram
import List
module ListExt
  pub open List
  pub let duplicateFirst xs =
    match xs with
    | []      => []
    | x :: xs => x :: x :: xs
    end
end
```

In the example above, the `ListExt` module contains all public definitions
from the `List` module, and also defines a new function `duplicateFirst`.

### Method Visibility

In Fram, each type variable forms its own namespace for methods. Thus methods
are always associated with a specific type rather than a module. As a
consequence, there is no need for opening a module to access methods defined
in it. To use methods defined for a type in some module `M`, you just need to
import module `M` directly, or indirectly by importing another module that
imports `M` (directly or indirectly).

```fram
# File: A.fram

# Importing the List module, but not opening it
import List

# Using the map method from the List module
let _ = [1, 2, 3].map (fn x => x + 1)
```

```fram
# File: B.fram

# Importing module A makes methods defined in List available
import A

# Using the map method from the List module, imported indirectly via A
let _ = [4, 5, 6].map (fn x => x * 2)

# However, direct access to List members still requires importing List
# let x = List.isEmpty [1] # This would cause an error
```

Due to this transitive property of method visibility, the user should avoid
redefining methods for types defined in other modules, as this may lead to
confusion about which method implementation is being used in a given context.
The best practice is to define methods only for types defined in the same
module.

Despite methods being associated with types rather than modules, there is
still a difference between public and private methods. Private methods can
only be used within the module where they are defined. In particular, the
user can define local methods for any type inside a module, without the
risk of name clashes with methods defined in other modules.

```fram
pub data T = C

# Defining a method foo for type T
pub method foo C = 42

pub module M
  # Defining a private method foo for type T inside module M
  method foo C = 13

  pub let useFoo (t : T) =
    # This will use the private method foo defined above
    t.foo + 1
end

pub let useFooOutside (t : T) =
  # This will use the public method foo defined outside module M
  t.foo + 2
```

## Packing Named Parameters

In Fram, modules can be used to pass multiple named parameters at once to
functions. When a special syntax `module M` is used in place of actual
named parameters, it instantiates all named parameters using matching public
members from module `M`. Consider the following example.

```fram
module Config
  pub let host    = "localhost"
  pub let port    = 8080
  pub let useSSL  = False
  pub let timeout = 30
end

let connect { host : String, port : Int, useSSL : Bool } () =
  # Connection logic here
  ()

let _ = connect { module Config } ()
```

In the example above, the `connect` function takes three named parameters:
`host`, `port`, and `useSSL`. When calling `connect`, we use the syntax
`{ module Config }` to pass all three parameters at once. Of course, this
module may contain other public members that are not used in this context
(such as `timeout`), and they will be ignored. Additionally, it is possible
to override specific parameters when using this syntax or pass other named
parameters not present in the module.

```fram
let connectSecurely () =
  connect { module Config, useSSL = True } ()

let getURL { protocol : String, host : String, port : Int } () =
  protocol + "://" + host + ":" + port.toString

let _ = getURL { module Config, protocol = "http" } ()
```

In the example above, the `connectSecurely` function overrides the `useSSL`
parameter to `True`, while the call to `getURL` function uses the `host` and
`port` parameters from the `Config` module and explicitly provides the
`protocol` parameter.

### Unpacking Named Parameters

A similar syntax can be used in patterns to unpack named parameters of a
constructor into a module. When the special syntax `module M` is used in a
place of named parameters in a pattern, it creates a module `M` that contains
all named parameters from the matched constructor as public members.

```fram
data Person = { name : String, age : Int, email : String }

let updateEmail (Person { module Info }) newEmail =
  Person { module Info, email = newEmail }
```

### Packing and Unpacking with Current Scope

A similar mechanism can be used to pass named parameters from the current
scope, or to unpack named parameters into the current scope. To do so, just
use the keyword `open` instead of `module M`. For instance, the previous
example can be rewritten as follows.

```fram
let updateEmail (Person { open }) newEmail =
  let email = newEmail in
  Person { open }
```

### Functors

The feature of packing and unpacking named parameters is particularly useful
in combination with existential types, as it allows to express most of the
functionality of functors (modules parameterized by other modules) found in
programming languages like OCaml and Standard ML. As an example, consider the
following definition of finite maps (dictionaries) parameterized by the type
of keys and an equality function for keys.

First we define a data type that represents a signature for such maps. There
is no analog of sharing constraints in Fram, so the `Key` type is a parameter
of the signature. Since Fram supports higher-rank polymorphism, such an
approach does not limit the expressiveness of the signature.

```fram
import List

pub data MapSig Key = Map of
  { T           : type -> type
  , empty       : {Val} -> T Val
  , method add  : {Val} -> T Val -> Key -> Val ->[] T Val
  , method find : {Val} -> T Val -> Key ->[] Option Val
  }
```

The `MapSig` type is an algebraic data type with a single constructor `Map`
with (existential) type parameter `T` that represents the type of maps for
given key type `Key`. Other named parameters represent the operations that
can be performed on such maps. Some of these operations are methods on the
type `T`. Next we can define a private data type that implements finite maps
together with operations on them. We use section mechanism to avoid passing
the `Key` type parameter and its equality method to each definition.

```fram
data MapImpl Key Val = MapImpl of (List (Pair Key Val))

section
  parameter Key
  parameter method equal : Key -> Key ->[] Bool

  let empty = MapImpl []

  method add (MapImpl impl) (key : Key) value =
    MapImpl ((key, value) :: impl.filter (fn (k, _) => not (key == k)))

  method find (MapImpl impl) (key : Key) =
    impl.findMap (fn (k, v) => if key == k then Some v else None)
end
```

Finally, we can define a functor, which in Fram is just a first-class
polymorphic function that takes a `Key` type and its equality method as named
parameters, and returns an element of type `MapSig Key`.

```fram
pub let make { Key, method equal : Key -> Key ->[] Bool } =
  Map { open }
```

To use the functor defined above, we can just call it providing the desired
key type, and unpacking the resulting signature into a module.

```fram
let (Map { module IntMap }) = make { Key = Int }
```

Note that in the above example, it is not necessary to provide the equality
method explicitly, since Fram will automatically use the method defined for
the `Int` type. However, if a custom equality method is desired, it can be
provided as well.

```fram
let (Map { module CustomMap }) =
  make { method equal (x : Int) (y : Int) = (x / 2) == (y / 2) }
```

To summarize, since we encode functors using existential types and first-class
polymorphic functions, functors in Fram are first-class citizens for free. On
the other hand, each time an existential type is unpacked, a new module is
created, so Fram functors have generative instead of applicative semantics.
This means that even if two functors are instantiated with identical
arguments, the resulting modules are considered distinct.
