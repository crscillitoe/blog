<h1 align="center">Never Give Up</h1>

It was a rainy Friday afternoon. I was sitting in a 45
minute queue to play some ~Twisted Treeline~ League of Legends with my friend
Arco. This is when I made the biggest mistake of my life:

> _"What do you do during these queues, Arco?"_ - Woohoojin

If I had known what events would transpire after hearing his response
to this question, I may have ended our friendship here. No amount of
preparation would've readied me for what was about to come:

> _"Ah, I just play these logic bridge puzzle games!"_ - Arco

> _"Logic bridge puzzle games..? Can I see?"_ - Woohoojin

> _"Yeah sure, \<REDACTED_LINK\>"_ - Arco

I open the link, and I see a website straight out of the 1900s. Not that this
is necessarily a bad thing; but the game itself was tiny, and the controls were
terribly unintuitive. I had to physically strain to even select the islands in
the game that I wanted to build bridges off of. I couldn't imagine playing this
for more than 10 minutes.

> _"This website **SUCKS**, I could make a better website!"_ - Woohoojin

> _"Yeah it's pretty bad, but it's the only one available."_ - Arco

> _"Woah, this Papachan guy is rank 1 on every board size."_ - Woohoojin

> _"He plays every day, I don't know how he is so fast."_ - Arco

> _"I'm going to end his reign."_ - Woohoojin

Now let me first tell you that I don't think I'm a bad person. If anything,
I fall directly under the chaotic neutral umbrella. I merely felt bad that this
poor Papachan fellow was not granted the wonderful taste of competition! Honestly,
you might even call me a _hero_, for pushing Papachan to better themselves in a
climate where they had clearly stagnated. Having only had this brief conversation
with Arco, I had already set my sights on dethroning Papachan, no matter how much
effort I had to invest.

It was a lot of effort.

So the simplest and most elegant solution here would be to simply beat Papachan, right?
There's just one problem, while I may be good at video games, I could not derive a single
ounce of happiness from playing these logic puzzle games. Additionally, Papachan is to
logic bridges as [Faker is to League of Legends](https://dotesports.com/league-of-legends/news/faker-the-greatest-of-all-time-9936).
While I'm willing to invest as much time as it takes, I'm going to be real with you here:
there's no way I was going to get better at these puzzles than Papachan.

This leaves one other, very fair option: computer assistance. How hard could it be
to ~cheat~ use a program to help me get a faster time on a website that is straight out
of the 1900s?

> _"How hard could it be?"_ - Woohoojin

So my first order of business was to open up my favorite network traffic sniffer, and
inspect the request being made to the API when a puzzle is completed.

You're not even going to believe me when I tell you this. The front-end was posting
_the entire html_ back to the back-end, where I presume it somehow extracted the board
state and checked if it was solved. I tried sending all forms of minified doms, containing
just the bare structure, and the board. None of it worked, the only way to satisfy this
API from hell was to send it the entire thing.

Okay fine, no big deal. I can just update the board state in the full html to the solved
state and then send it back.

Now before I invested some time into writing a solver for these puzzles, I wanted to first
see if there were any easy workarounds on their API.

What happens if I send a valid solution to any board?

- It doesn't work. The DOM contains the seed for the board and if you adjust the board solution it won't match the seed.

Well what happens if I adjust the seed too?

- It still doesn't work. The API must somehow be associating a given session with a given seed on the back-end.

Alright, I guess I'll write a program that solves these puzzles. How do I pull the initial board state from the DOM?

... 30 minutes later

... How do I pull the initial board state from the DOM?!?

... 2 hours later

... It can't be...

... Are you _kidding_?!

Let me preface this by telling you that this website was written in PHP, and the server is sending me a pre-rendered DOM
when I request a board. I shit you not, this API was generating the board, then _splitting_ up the island locations from the
numbers that belong on those islands into two completely separate components. It was essentially obfuscating a major factor
in the puzzle game.

Here's what I saw in the HTML:

```javascript
wall[0][0] = 1;
wall[0][24] = 1;
wall[1][1] = 1;
wall[1][5] = 1;
wall[1][12] = 1;
wall[1][14] = 1;
wall[1][16] = 1;
// omitted for brevity
```

Conveniently, the `[1][5]` you see here essentially means there exists an island at `x = 5, y = 1` (you can see this in the image coming up soon).
The real problem is, it doesn't tell me _what_ value is on the island!

Imagine if I sent you a Sudoku game, but I only told you _where_ the first numbers were, not _what_ they were.

Well, the DOM has to know _what_ the numbers are somehow, right? How else will the user be able to play the games?

To answer that very logical question, I now present you with the following image:

![](https://raw.githubusercontent.com/crscillitoe/LogicBridges/master/Image.png?token=AFJQ3E6ISMLA7U5CRVJILD263U4BY)

I understand if you still haven't realized it yet. But when I saw this, my heart began to sink a little.
The API embeds the numbers on the board as a raw image. Sure, all the data I need is there... but I can't easily
parse a PNG file for these numbers.

... Or can I?

A few hours of research later, I stumble upon [tesseract](https://github.com/tesseract-ocr/tesseract), an open source OCR engine.
I could use this program to read my PNG file to get the numbers into a computer-digestible format.

So, it's simple, right?

```bash
tesseract board_image.png >> out.txt && cat out.txt

2229a112923554...
```

Unforunately, you can tell by this output, that tesseract was not delivering.
You can clearly see the letter `a` in the output here, which is definitely wrong.
If I wanted to game the system, I needed precision.

So for my first order of business, I let tesseract know that the only characters it will ever see in these images are the
digits 1-8:

```
tessedit_char_whitelist 12345678
```

Next I manually opened this image file in a character mapping program, which lets me manually label individual characters
in the image. I created 4-5 of these maps from existing boards, and then I trained tesseract on those maps. You can grab a copy
of my trained data [here](https://github.com/crscillitoe/LogicBridges/blob/master/tessdata/mylang.traineddata).

After training tesseract, I was able to read images with 100% precision:

```bash
TESSDATA_PREFIX=/dir/to/my/tessdata
tesseract board_image.png >> out.txt && cat out.txt

22244112223564...
```

Success! Now that I know the positions of every island, and the numbers on the islands in order,
I can combine this data and form an output like this:

```python
os.system(f"curl \"www.<REDACTED>.com/task.php?id={ID}\&size=11\" > Image.png")
os.system("tesseract -psm 6 --tessdata-dir . Image.png output -l mylang")

with f = open("board.data" , "w"):
    count = 0
    for y in range(25) :
        for x in range(25) :
            if xPos[count] == x and yPos[count] == y :
                try :
                    f.write(nodes[count])
                    count = count + 1
                except :
                    pass
            else :
                f.write('x')
        f.write('\n')
```

```bash
cat board.data

1-----------------------1
-2--3-------3-4-4--3---5-
-------------------------
-7-----5----3--------1-2-
------------------6------
--------------2--------2-
------------------3-2----
-----------------------2-
----2--2--3---2---4-4----
-1----------1------------
----1------3--5-----7----
-4-2--1--------2-----1-4-
----4--------------------
-1----6----4--3------3--6
----------------2---1-1--
--3---3-----5------------
4-------------5---3-----
```

Perfect. Now this is a digestible format that I can pass to a solver.
Writing a solver should be easy enough, right?

First we define some classes to represent our islands (Nodes) and bridges:

```python
class Node:
    def __init__(self, x: int, y: int, value: int):
        self.x = x
        self.y = y
        self.v = value

class Bridge:
    def __init__(self, node1: Node, node2: Node):
        self.n1 = node1
        self.n2 = node2
```

Before I show you the rest of the code, please understand that this is a one-off and
I had no plans on ever showing this to the world. Please scroll quickly past this for
both of our sakes.

```python
def isBridge(name1 , name2) :
    global bridges
    for b in bridges :
        if (b.n1 == name1 and b.n2 == name2) or (b.n1 == name2 and b.n2 == name1) :
            return True
    return False

def isNodeAt(posx , posy , nodes) :
    for n in nodes :
        if n.x == posx and n.y == posy :
            return True
    return False

def getDoubleBridgeAt(posx , posy , nodes) :
    global bridges
    count = 0
    for b in bridges :
       val1 = b.n1
       val2 = b.n2
       for n in nodes :
           if n.n == val1 :
               node1 = n
           elif n.n == val2 :
               node2 = n


       if node1.x == node2.x :
           if posx == node1.x :
               if (posy < node2.y and posy > node1.y) or (posy > node2.y and posy < node1.y) :
                   if count == 1 :
                        return b
                   else :
                        count = count + 1
       if node1.y == node2.y :
           if posy == node1.y :
               if (posx < node2.x and posx > node1.x) or (posx > node2.x and posx < node1.x) :
                   if count == 1 :
                        return b
                   else :
                        count = count + 1
    return False

def isDoubleBridgeAt(posx , posy , nodes) :
    global bridges
    count = 0
    for b in bridges :
       val1 = b.n1
       val2 = b.n2
       for n in nodes :
           if n.n == val1 :
               node1 = n
           elif n.n == val2 :
               node2 = n


       if node1.x == node2.x :
           if posx == node1.x :
               if (posy < node2.y and posy > node1.y) or (posy > node2.y and posy < node1.y) :
                   if count == 1 :
                        return True
                   else :
                        count = count + 1
       if node1.y == node2.y :
           if posy == node1.y :
               if (posx < node2.x and posx > node1.x) or (posx > node2.x and posx < node1.x) :
                   if count == 1 :
                        return True
                   else :
                        count = count + 1
    return False

def isDoubleBridge(name1 , name2) :
    global bridges
    count = 0
    for b in bridges :
        if (b.n1 == name1 and b.n2 == name2) or (b.n1 == name2 and b.n2 == name1) :
            if count == 1 :
                return True
            else :
                count = count + 1
    return False


#Creates a bridge between 2 nodes.
#It is assumed that this bridge can be created.
def formBridge(node1 , node2) :
    global bridges
    node1.v = node1.v - 1
    node2.v = node2.v - 1
    bridges.append(Bridge(node1.n , node2.n))

def printUnsolvedBoard(filePath) :
    print("Unsolved : ")
    print()
    f = open(filePath , "r")
    lines = f.readlines()
    for l in lines :
        lineString = ""
        for c in l :
            if c == 'x' or c == '\n' :
                lineString = lineString + " "
            else :
                lineString = lineString + c
        print(lineString)

def isHorizontalDoubleBridgeAt(x , y , nodes) :
    global bridges
    for n in nodes :
        if x == n.x and y == n.y :
            return False
    if isDoubleBridgeAt(x , y , nodes) == False :
        return False

    b = getDoubleBridgeAt(x , y , nodes)
    n1 = getNode(b.n1 , nodes)
    n2 = getNode(b.n2 , nodes)
    if n1.y == n2.y :
        return True
    return False



def isHorizontalBridgeAt(x , y , nodes) :
    global bridges
    for n in nodes :
        if x == n.x and y == n.y :
            return False
    if isBridgeAt(x , y , nodes) == False :
        return False

    b = getBridgeAt(x , y , nodes)
    n1 = getNode(b.n1 , nodes)
    n2 = getNode(b.n2 , nodes)
    if n1.y == n2.y :
        return True
    return False


def getBridgeAt(posx , posy , nodes) :
    global bridges
    for b in bridges :
       val1 = b.n1
       val2 = b.n2
       for n in nodes :
           if n.n == val1 :
               node1 = n
           elif n.n == val2 :
               node2 = n

       if node1.x == node2.x :
           if posx == node1.x :
               if (posy < node2.y and posy > node1.y) or (posy > node2.y and posy < node1.y) :
                   return b
       if node1.y == node2.y :
           if posy == node1.y :
               if (posx < node2.x and posx > node1.x) or (posx > node2.x and posx < node1.x) :
                   return b
    return False

#Returns True if there is a bridge at the given point.
def isBridgeAt(posx , posy , nodes) :
    global bridges
    for b in bridges :
       val1 = b.n1
       val2 = b.n2
       for n in nodes :
           if n.n == val1 :
               node1 = n
           elif n.n == val2 :
               node2 = n

       if node1.x == node2.x :
           if posx == node1.x :
               if (posy < node2.y and posy > node1.y) or (posy > node2.y and posy < node1.y) :
                   return True
       if node1.y == node2.y :
           if posy == node1.y :
               if (posx < node2.x and posx > node1.x) or (posx > node2.x and posx < node1.x) :
                   return True
    return False


def printBoard(filePath , nodes) :
    print("Solved : ")
    print()
    f = open(filePath , "r")
    solution = ""
    lines = f.readlines()
    y = 1
    x = 1
    for l in lines :
        lineString = "    "
        x = 1
        for c in l :
            if isHorizontalDoubleBridgeAt(x , y , nodes) :
                lineString = lineString + "═"
                solution = solution + "="
            elif isDoubleBridgeAt(x , y , nodes) :
                lineString = lineString + "║"
                solution = solution + "n"
            elif isHorizontalBridgeAt(x , y , nodes) :
                lineString = lineString + "─"
                solution = solution + "-"
            elif isBridgeAt(x , y , nodes) :
                lineString = lineString + "│"
                solution = solution + "i"
            elif c != 'x' and c != '\n':
                lineString = lineString + c
                solution = solution + "x"
            elif c!= '\n':
                lineString = lineString + " "
                solution = solution + "x"
            else :
                lineString = lineString + " "


            x = x + 1
        print(lineString)
        y = y + 1
    print(solution)
    return solution

#Reads the board from the given file and
#returns the proper node array
def readIntoData(filePath) :
    names = []
    for i in range(5000) :
        names.append(i)
    f = open(filePath , "r")
    lines = f.readlines()
    y = 1
    x = 1
    nodes = []
    count = 0
    for l in lines :
        x = 1
        for c in l :
            if c == 'x' or c == '\n' :
                pass;
            else :
                val = eval(c)
                nodes.append(Node(x , y , val , names[count]))
                count = count + 1
            x = x + 1
        y = y + 1
    return nodes


def solveTrivialNode(node , nodes) :
    if node.v == 0 :
        return 0
    global bridges
    validNeighbors = getNeighbors(node , nodes)
    numberNeighbors = numNeighbors(node , nodes)
    total = 0
    for n in validNeighbors :
        if n != '' :
            total = total + getNodeVal(n , nodes)

    if numberNeighbors != 0 :
        if node.v/numberNeighbors == 2 :
            for n in validNeighbors :
                if n != '' :
                    print("Solving trivial node {}...".format(node.n))
                    neighbor = getNode(n, nodes)
                    formBridge(node , neighbor)
                    formBridge(node , neighbor)
                    solveTrivialNode(neighbor , nodes)
                    return 1
        elif node.v == 1 and numberNeighbors == 1 :
            for n in validNeighbors :
                if n != '' :
                    print("Solving trivial node {}...".format(node.n))
                    neighbor = getNode(n , nodes)
                    formBridge(node , neighbor)
                    solveTrivialNode(neighbor , nodes)
                    return 1
        elif node.v == total :
            for n in validNeighbors :
                if n != '':
                    if getNodeVal(n , nodes) == 2 and getNodeVal(node.n , nodes) >= 2:
                        print("Solving trivial node {}...".format(node.n))
                        neighbor = getNode(n , nodes)
                        formBridge(node , neighbor)
                        formBridge(node , neighbor)
                        solveTrivialNode(neighbor , nodes)
                        return 1
                    else :
                        print("Solving trivial node {}...".format(node.n))
                        neighbor = getNode(n , nodes)
                        formBridge(node , getNode(n , nodes))
                        solveTrivialNode(neighbor , nodes)
                        return 1
#        elif node.v == numNeighborBridges(node , nodes) :
#            for n in validNeighbors :
#                if n != '' :
#                    if getNodeVal(n , nodes) >= 2 and getNodeVal(node.n , nodes) >= 2:
#                        print("Solving trivial node {}...".format(node.n))
#                        neighbor = getNode(n , nodes)
#                        formBridge(node , neighbor)
#                        formBridge(node , neighbor)
#                        solveTrivialNode(neighbor , nodes)
#                        return 1
#                    else :
#                        print("Solving trivial node {}...".format(node.n))
#                        neighbor = getNode(n , nodes)
#                        formBridge(node , neighbor)
#                        solveTrivialNode(neighbor , nodes)
#                        return 1

    return 0


def numNeighborBridges(node , nodes) :
    validNeighbors = getNeighbors(node , nodes)
    total = 0
    for n in validNeighbors :
        if n != '' :
            if getNodeVal(n , nodes) > 1 :
                total = total + 2
            elif getNodeVal(n , nodes) == 1 :
                total = total + 1
    return total

def fancySolve(node , nodes) :
    if node.v == 0 :
        return 0
    global bridges
    validNeighbors = getNeighbors(node , nodes)
    numberNeighbors = numNeighbors(node , nodes)
    for n in validNeighbors :
        if n != '' :
            neighbor = getNode(n , nodes)
            neighborNumber = numNeighbors(neighbor , nodes)
            if neighborNumber == 2 and neighbor.v >= 3 and node.v >= 1:
                print("Solving fancy node {}...".format(node.n))
                formBridge(node , neighbor)
                return 1
            elif neighborNumber == 3 and neighbor.v >= 5 and node.v >= 1 :
                print("Solving fancy node {}...".format(node.n))
                formBridge(node , neighbor)
                return 1
            elif neighborNumber == 4 and neighbor.v >= 7 and node.v >= 1:
                print("Solving fancy node {}...".format(node.n))
                formBridge(node , neighbor)
                return 1
    return 0

def getNodeVal(name , nodes) :
    return getNode(name , nodes).v

def solveBoard(nodes) :
    count = 1
    while count >= 1 :
        count = 0
        for n in nodes :
            count = count + solveTrivialNode(n , nodes)
        if count == 0 :
            for n in nodes :
                count = count + fancySolve(n , nodes)
                if count > 0 :
                    break

def getNode(name , nodes) :
    for n in nodes :
        if n.n == name :
            return n

def numNeighbors(node , nodes) :
    nodeList = getNeighbors(node , nodes)
    count = 0
    for i in nodeList :
        if i != '' :
            count = count + 1
    return count

#Returns a list of all the neighboring nodes
def getNeighbors(node , nodes) :
    closest = 99
    #Format : [Down , Up , Left , Right]
    neighbors = ['' , '' , '' , '']
    counter = 0
    found = ''
    for n in nodes :
        if node.x == n.x and (node.y - n.y != 0) and (abs(node.y - n.y) < closest) and (n.y > node.y):
            do = 1
            for y in range(abs(node.y - n.y)) :
                if y != 0 :
                    if isBridgeAt(node.x , node.y + y , nodes) or isNodeAt(node.x , node.y + y , nodes):
                        do = 0
            if do == 1 :
                if isBridge(node.n , n.n) == False :
                    if n.v > 0 :
                        if n.p != 1 or node.p != 1 :
                            found = n.n
            closest = abs(node.y - n.y)
    if closest != 99 :
        neighbors[counter] = found
    counter = counter + 1

    closest = 99
    found = ''
    for n in nodes :
        if node.x == n.x and (node.y - n.y != 0) and (abs(node.y - n.y) < closest) and (n.y < node.y):
            do = 1
            for y in range(abs(node.y - n.y)) :
                if y != 0 :
                    if isBridgeAt(node.x , n.y + y , nodes) or isNodeAt(node.x , n.y + y , nodes) :
                        do = 0
            if do == 1 :
                if isBridge(node.n , n.n) == False :
                    if n.v > 0 :
                        if n.p != 1 or node.p != 1 :
                            found = n.n
            closest = abs(node.y - n.y)
    if closest != 99 :
        neighbors[counter] = found
    counter = counter + 1

    closest = 99
    found = ''
    for n in nodes :
        if node.y == n.y and (node.x - n.x != 0) and (abs(node.x - n.x) < closest) and (n.x < node.x):
            do = 1
            for x in range(abs(node.x - n.x)) :
                if x != 0 :
                    if isBridgeAt(n.x + x, node.y, nodes) or isNodeAt(n.x + x , node.y , nodes) :
                        do = 0
            if do == 1 :
                if isBridge(node.n , n.n) == False :
                    if n.v > 0 :
                        if n.p != 1 or node.p != 1 :
                            found = n.n
            closest = abs(node.x - n.x)
    if closest != 99 :
        neighbors[counter] = found
    counter = counter + 1

    closest = 99
    found = ''
    for n in nodes :
        if node.y == n.y and (node.x - n.x != 0) and (abs(node.x - n.x) < closest) and (n.x > node.x):
            do = 1
            for x in range(abs(node.x - n.x)) :
                if x != 0 :
                    if isBridgeAt(node.x + x, node.y, nodes) or isNodeAt(node.x + x , node.y , nodes) :
                        do = 0
            if do == 1 :
                if isBridge(node.n , n.n) == False :
                    if n.v > 0 :
                        if n.p != 1 or node.p != 1 :
                            found = n.n
            closest = abs(node.x - n.x)
    if closest != 99 :
        neighbors[counter] = found
    counter = counter + 1

    return neighbors
```

The TL;DR of that code block (you didn't actually read it, right?!) is that there is one specific
edge case in these solutions that is NP hard to solve (I'm building a directed graph of nodes, you can imagine the problem).
So I implemented a very greedy solution which correctly solves boards about 15% of the time. This is good enough for me,
because I can just run my program 8-9 times, and get a valid solution in much faster time than Papachan!

So, all that was left was to run this bad boy, and submit my times:

![](https://images.woohoojin.dev/️🍆😳😳😩😩🍑💦🅱️😳👌🍆🚨👀👁💩💦💩🍆.png)

Did I forget to mention the part where I made sure my bot only uploaded times that were
marginally better than Papachans? How's _that_ for competition!

(You can find all of my garbage code on my github repository [here](https://github.com/crscillitoe/LogicBridges).
Some parts of this story have been slightly simplified/modified for the readers' sake.)
