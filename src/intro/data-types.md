# Data Types

## Basics

User can define custom data types using the `data` keyword. Fram supports
so called *algebraic data types* (ADTs), where a type can be defined as a
list of its constructors. In the simplest case, when constructors do not
take any parameters, the data type definition is just an enumeration of
the constructors. Names of types and their constructors must start with a
capital letter.

```fram
data Direction = North | South | East | West
```

However, constructors can also take parameters. In this case, the
constructor is followed by `of` keyword and a comma separated list of
types of the parameters. The bar before the first constructor is optional.

```fram
data Shape =
  | Arrow     of Direction
  | Circle    of Int
  | Rectangle of Int, Int
```

Constructors of data types can be used as regular values. Constructors with
parameters can be used as functions, and in particular, they can be partially
applied.

```fram
let westArrow = Arrow West
let r13 = Rectangle 13
```

Data types can be parametrized by other types.

```fram
data OptPair X Y =
  | OnlyLeft  of X
  | OnlyRight of Y
  | Both      of X, Y
```

## Pattern Matching

Elements of data types can be deconstructed and analyzed using pattern
matching. Pattern matching is done using the `match ... with` construct,
followed by the list of pattern matching clauses and the `end` keyword.
Each clause consists of a pattern and an expression (body of the clause).
The pattern can be built from constructors and binds variables that can
be used in the body of the clause.

```fram
let swapOptPair p =
  match p with
  | OnlyLeft  x => OnlyRight x
  | OnlyRight y => OnlyLeft  y
  | Both x y    => Both y x
  end
```

Fram supports deep pattern matching, i.e. matching on nested constructors.
Additionally, the wildcard pattern `_` can be used to match any value without
binding any variables. Because regular variables start with a lowercase letter,
it is always clear when a pattern binds a variable or matches a constructor
without parameters.

```fram
let rotate shape =
  match shape with
  | Arrow North   => Arrow East
  | Arrow South   => Arrow West
  | Arrow East    => Arrow South
  | Arrow West    => Arrow North
  | Rectangle w h => Rectangle h w
  | Circle _      => shape
  end
```

Patterns of different clauses within the same `match` construct may overlap.
In this case, the first matching clause is used. Provided patterns must be
*exhaustive*, i.e. eacho of possible values of the matched expression must be
covered by at least one pattern.

Fram allows to use pattern in almost any place where a variable binder can be
used. For example, patterns can be used in `let` bindings or as function
parameters. Such patterns must obey the exhaustiveness condition.

```fram
data Triple = Triple of Int, Int, Int

let sum1 (Triple x y z) =
  x + y + z

let sum2 t =
  let (Triple x y z) = t in
  x + y + z
```

## Recursive Data Types

In Fram, data types can be recursive. This means that a data type can
contain constructors that refer to the same data type. For example, a
binary tree can be defined as follows.

```fram
data Tree X =
  | Leaf
  | Node of Tree, X, Tree
```

Note that recursive data types must be explicitly marked using the `rec`
keyword. Mutually recursive data types can be defined using a `rec ... end`
block. The same block can be shared with mutually recursive functions.

```fram
rec
  data RoseTree X = Node of X, RoseTreeList X

  data RoseTreeList X =
    | Nil
    | Cons of RoseTree X, RoseTreeList X

  let map f (Node x ts) =
    Node (f x) (mapList f ts)

  let mapList f ts =
    match ts with
    | Nil       => Nil
    | Cons t ts => Cons (map f t) (mapList f ts)
    end
end
```

## Constructors with Named Parameters

Constructors can also have named parameters. This is useful when the meaning
of the parameter is not clear from its type nor the position.

```fram
data Color =
  | RGB  of { red : Int, green : Int, blue : Int }
  | CMYK of { cyan : Int, magenta : Int, yellow : Int, black : Int }
```

Named parameters of the constructor become part of its type scheme. Similarly
to named parameters of functions, they must be always provided, but their order
does not matter.

```fram
let orange = RGB { red = 255, green = 127, blue = 0 }
let black  = CMYK { black = 100, cyan = 0, magenta = 0, yellow = 0 }
```

Similarly, parameters of the data are attached to the constructor's scheme.
This means that these parameters might be explicitly provided when the
constructor is used.

```fram
let emptyIntTree = Leaf {X=Int}
```

To enforce type parameters to become anonymous, the `type` keyword can be
used at the place of binding.

```fram
data Box (type X) = Box of { value : X }
```

Named parameters of the constructor can be used in pattern matching. The
syntax is similar to the one used in explicit binding of named parameters
of functions: after the name of the parameter, the `=` sign is used to
provide the pattern for the parameter. For convenience, the `=` sign can be
omitted if the pattern is a variable of the same name as the parameter.
It is also possible to omit some of the named parameters.

```fram
let unboxGetRed c =
  match c with
  | Box { value = RGB { red } } => red
  | _ => 0
  end
```

## Records

In Fram, records are just syntactic sugar for data types with only one
constructor which has only named parameters. To define a record, the
name of the constructor and the `of` keyword are omitted.

```fram
data Vec3D T =
  { x : T
  , y : T
  , z : T
  }
```

For record definitions, methods for accessing the fields are generated
automatically. The above definition is equivalent to the following
sequence of definitions.

```fram
data Vec3D T = Vec3D of { x : T, y : T, z : T }

method x (Vec2D { x }) = x
method y (Vec2D { y }) = y
method z (Vec2D { z }) = z
```

Therefore, records can be used in a similar way as records in other
languages, but in fact, all operations on records are just combination of
named parameters, methods, and constructors of ADTs.

```fram
let cross (v1 : Vec3D Int) (v2 : Vec3D Int) =
  Vec3D
    { x = v1.y * v2.z - v1.z * v2.y
    , y = v1.z * v2.x - v1.x * v2.z
    , z = v1.x * v2.y - v1.y * v2.x
    }
```

## Existential Types

In Fram, each kind of named parameter can be a parameter of the constructor.
In particular, constructors can have type parameters. Such parameters behave
like existential types, i.e., their actual definition is not accessible when
the data type is deconstructed. In the next chapter, we will see the most
common use of existential types in Fram, but first let's start with a simple
toy example. Here we define a Church encoding of an infinite stream, i.e., the
stream is defined by its own unfold.

```fram
data Stream X =
  Stream of {St, state : St, elem : St ->[] X, next : St ->[] St}
```

The stream has a private state `state` of some type `St`, which can be
different for each stream. The `elem` function computes the first element
of the stream and the `next` function computes the next state of the tail of
the stream. Note that the stream is not defined as a record. This is because
the type `St` is not visible outside the constructor. In general, Fram forbids
to use existential types in the record definition.

Existential types are just type parameters to the constructor, and as with
other forms of type parameters, the user can provide them explicitly, or rely
on the type inference.

```fram
let natStream =
  Stream
    { St    = Int
    , state = 0
    , elem  = fn n => n
    , next  = fn n => n + 1
    }

let tail (Stream {state, elem, next}) =
  Stream { state = next state, elem, next }
```

Name existential types can be explicitly bound in the pattern matching.

```fram
let cons x (Stream {St, state, elem, next}) =
  Stream
    { St    = Option St
    , state = None
    , elem  = fn s =>
        match s with
        | None   => x
        | Some s => elem s
        end
    , next  = fn s =>
        match s with
        | None   => Some state
        | Some s => Some (next s)
        end
    }
```

## Empty Data Types

Data types can have empty list of constructors.

```fram
data Empty =
```

Pattern matching on empty data types is possible, but the type of the
matched expression must be known from the context.

```fram
let ofEmpty (x : Empty) =
  match x with
  end
```
