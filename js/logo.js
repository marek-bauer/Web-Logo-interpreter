class Logo {
    constructor(canvas, minX, maxX, minY, maxY) {
        this.ctx = canvas.getContext("2d")
        this.width = canvas.width
        this.height = canvas.height
        this.posX = 0 //position of turtle
        this.posY = 0
        this.angle = 0 //angle of "turtle"
        this.weight = "1px";
        this.penDown = true
        this.color = '#000';
        this.functions = new Map([ //Standard functions
            ["LEFT", ((args) => this.angle = (this.angle + args[0]) % 360).bind(this)],
            ["RIGHT", ((args) => this.angle = (this.angle - args[0]) % 360).bind(this)],
            ["FORWARD", ((args) => this.forward(args[0])).bind(this)],
            ["BACKWARD", ((args) => {
                this.angle = (this.angle + 180) % 360
                this.forward(args[0])
                this.angle = (this.angle + 180) % 360
            }).bind(this)],
            ["CLEARSCREEN", ((args) => this.clear()).bind(this)],
            ["PENUP", ((args) => this.penDown = false).bind(this)],
            ["PENDOWN", ((args) => this.penDown = true).bind(this)],
            ["LT", ((args) => this.angle = (this.angle + args[0]) % 360).bind(this)],
            ["RT", ((args) => this.angle = (this.angle - args[0]) % 360).bind(this)],
            ["FD", ((args) => this.forward(args[0])).bind(this)],
            ["BC", ((args) => {
                this.angle = (this.angle + 180) % 360
                this.forward(args[0])
                this.angle = (this.angle + 180) % 360
            }).bind(this)],
            ["CS", ((args) => this.clear()).bind(this)],
            ["PU", ((args) => this.penDown = false).bind(this)],
            ["PD", ((args) => this.penDown = true).bind(this)],
            ["SETXY", ((args) => {
                this.posX = args[0]
                this.posY = args[1]
            }).bind(this)],
            ["COLOR", ((args) => this.color=`rgb(${args[0]}, ${args[1]}, ${args[2]})`).bind(this)],
            ["SIZE", ((args) => this.weight=`${args[0]}px`).bind(this)],
        ])
        this.functionsArgs = new Map([ //Number of arguments of standard functions
            ["LEFT", 1],
            ["RIGHT", 1],
            ["FORWARD", 1],
            ["BACKWARD", 1],
            ["CLEARSCREEN", 0],
            ["PENUP", 0],
            ["PENDOWN", 0],
            ["LT", 1],
            ["RT", 1],
            ["FD", 1],
            ["BC", 1],
            ["CS", 0],
            ["PU", 0],
            ["PD", 0],
            ["SETXY", 2],
            ["COLOR", 3],
            ["SIZE", 1],
        ])
        this.changeSizes(minX, maxX, minY, maxY)
    }

    /**
     * Function changes current perspective
     * @param minX
     * @param maxX
     * @param minY
     * @param maxY
     */
    changeSizes(minX, maxX, minY, maxY) {
        this.clear()
        this.YScalar = -this.height / (maxY - minY)
        this.XScalar = this.width / (maxX - minX)
        this.XBegin = (-this.XScalar * minX)
        this.YBegin = (-this.YScalar * maxY)
        this.posX = 0 //position of turtle
        this.posY = 0
        this.angle = 0 //angle of "turtle"
    }

    /**
     * Function converts logo position into pixels
     * @param pos{Number[]} - position in logo coordinates
     * @returns {Number[]} - position in pixels of canvas
     */
    converter(pos) {
        return [pos[0] * this.XScalar + this.XBegin,
            pos[1] * this.YScalar + this.YBegin]
    }

    /**
     * Clears screen
     */
    clear() {
        this.ctx.fillStyle = '#fff'
        this.ctx.fillRect(0, 0, this.width, this.height)
    }

    /**
     * Draw line in logo coordinates
     * @param begin
     * @param end
     */
    strokeLine(begin, end) {
        this.ctx.strokeStyle = this.color;
        this.ctx.strokeWidth = this.weight;
        this.ctx.beginPath();
        this.ctx.moveTo(...this.converter(begin));
        this.ctx.lineTo(...this.converter(end));
        this.ctx.stroke();
    }

    /**
     * Computes vector of specific length and angle
     * @param angle - angle in degrees
     * @param dist - length of cector
     * @returns {number[]}
     */
    angleMove(angle, dist) {
        return [Math.cos(Math.PI * (angle / 180)) * dist,
            Math.sin(Math.PI * (angle / 180)) * dist]
    }

    /**
     * Moves turtle forward
     * @param dist - distance to go
     */
    forward(dist) {
        let [shiftX, shiftY] = this.angleMove(this.angle, dist) //gets vector of move
        if (this.penDown) {
            this.strokeLine([this.posX, this.posY], [this.posX + shiftX, this.posY + shiftY])
            this.posX = this.posX + shiftX
            this.posY = this.posY + shiftY
        } else {
            this.posX = this.posX + shiftX
            this.posY = this.posY + shiftY
        }
    }

    /**
     * Changes list of instructions into list of function performing this instructions
     * @param list
     * @returns {function[]}
     */
    interpretInstructions(list) {
        let res = []
        for (let i = 0; i < list.length; i++) {
            if (list[i] === "REPEAT") { //if instruction is REPEAT
                let ins, end, pos = i
                if (list[i + 2] === "[") {
                    end = findEndBracket(list, i + 2)
                    ins = this.interpretInstructions(list.slice(i + 3, end))
                } else {
                    throw ("No brackets in REPEAT")
                }
                res.push(((args) => { // creates function performing n times list of instruction
                    let lim = evalExp(list[pos + 1], args) //Evaluates number of repetitions (in run time)
                    for (let i = 0; i < lim; i++) {
                        this.runInstructions(ins, args)
                    }
                }).bind(this))
                i = end;
            } else if (list[i] === "IF") { //if instruction is IF
                let ins, end, pos = i
                if (list[i + 2] === "[") {
                    end = findEndBracket(list, i + 2)
                    ins = this.interpretInstructions(list.slice(i + 3, end)) //generates list of functions to perform
                } else {
                    throw ("No brackets in IF statement")
                }
                res.push(((args) => { // creates function performing instruction
                    let cond = evalExp(list[pos + 1], args) //Evaluates condition (in run time)
                    if (cond) {
                        this.runInstructions(ins, args)
                    }
                }).bind(this))
                i = end;
            } else if (list[i] === "IFELSE") { //if instruction is IFELSE
                let ins, ins2, end, pos = i
                if (list[i + 2] === "[") {
                    end = findEndBracket(list, i + 2)
                    ins = this.interpretInstructions(list.slice(i + 3, end)) //generates list of functions to perform
                } else {
                    throw ("No brackets in IFELSE statement")
                }
                if (list[end + 1] === "[") {
                    end = findEndBracket(list, end + 1)
                    ins2 = this.interpretInstructions(list.slice(i + 3, end)) //generates list of functions to perform
                } else {
                    throw ("No brackets in IFELSE statement")
                }
                res.push(((args) => { // creates function performing instruction
                    let cond = evalExp(list[pos + 1], args) //Evaluates condition (in run time)
                    if (cond) {
                        this.runInstructions(ins, args)
                    } else {
                        this.runInstructions(ins2, args)
                    }
                }).bind(this))
                i = end;
            } else if (this.functionsArgs.has(list[i])) { //if is known function
                let num_of_args = this.functionsArgs.get(list[i]) //gets number of arguments
                let fName = list[i] //gets function name
                let pos = i
                res.push(((args) => { // creates function performing instruction
                    //evaluates parameters of function (in run time)
                    let parameters = list.slice(pos + 1, pos + num_of_args + 1).map((exp) => evalExp(exp, args))
                    //gets function by its name and runs it with parameters (searching in run time lets define recursive functions)
                    this.functions.get(fName)(parameters)
                }).bind(this))
                i += num_of_args
            }
        }
        return res
    }

    /**
     * Run list of functions with arguments of run
     * @param ins - list of functions
     * @param args - list of arguments
     */
    runInstructions(ins, args) {
        for (let i of ins) {
            i(args)
        }
    }

    /**
     * Adds function to map of functions
     * @param list{String} - list of instruction in plain text
     * @param name{String}
     */
    addFunction(list, name) {
        let map = new Map()
        let i = 0;
        //search for arguments
        while (list[0][0] === ":") {
            map.set(list[0], ":" + i + "'")
            list.shift()
            i++
        }
        //replaces users parameters format (:name) with unified format (:number_of_argument')
        list = list.map((elem) => {
            for (let [from, to] of map) {
                elem = elem.replace(from, to)
            }
            return elem
        })
        //Adds function to list of arguments functions (in order to define recursive function)
        this.functionsArgs.set(name, i)
        let commands = this.interpretInstructions(list) //gets list of functions to perform
        //Adds function to list of functions
        this.functions.set(name, ((args) => this.runInstructions(commands, args)).bind(this))
    }

    /**
     * Interprets user input
     * @param instructions{String}
     */
    interpret(instructions) {
        try {
            //Looks for function in definition and creates them
            let [ins, names, func] = cutFunctionsOut(prepareInstructions(instructions))
            for (let i = 0; i < names.length; i++) {
                this.addFunction(func[i], names[i])
            }
            //Runs none definition part of code
            ins = this.interpretInstructions(ins)
            this.runInstructions(ins, [])
        } catch (error){
            alert(error)
        }
    }
}

/**
 * Splits user input into instructions chinks of code and replaces LOGO operators with JS operators
 * @param ins
 * @returns {string[]}
 */
function prepareInstructions(ins) {
    return ins.toUpperCase()
        .replaceAll(/[\t\n\r]/gm, ' ')
        .replaceAll("[", " [ ")
        .replaceAll("]", " ] ")
        .replaceAll(/ +(?= )/g, '')
        .trim()
        .replaceAll("^", "**")
        .replaceAll(" +", "+").replaceAll("+ ", "+")
        .replaceAll(" -", "-").replaceAll("- ", "-")
        .replaceAll(" *", "*").replaceAll("* ", "*")
        .replaceAll(" /", "/").replaceAll("/ ", "/")
        .replaceAll(" )", ")").replaceAll("( ", "(")
        .replaceAll(" =", "=").replaceAll("= ", "=")
        .replaceAll(" <", "<").replaceAll("< ", "<")
        .replaceAll(" >", ">").replaceAll("> ", ">")
        .replaceAll(" |", "|").replaceAll("| ", "|")
        .replaceAll(" !", "!").replaceAll("! ", "!")
        .replaceAll(" &", "&").replaceAll("& ", "&")
        .replaceAll("COS ", "myCos").replaceAll("COS", "myCos")
        .replaceAll("SIN ", "mySin").replaceAll("SIN", "mySin")
        .replaceAll("SQRT ", "Math.sqrt").replaceAll("SQRT", "Math.sqrt")
        .replaceAll("LN ", "Math.log").replaceAll("LN", "Math.log")
        .replaceAll("EXP ", "Math.exp").replaceAll("EXP", "Math.exp")
        .split(" ")
}

/**
 * Evaluates expression using list of arguments
 * @param exp
 * @param args
 * @returns {any}
 */
function evalExp(exp, args) {
    //Replaces arguments with their know values
    let prepare = exp
    for (let i = 0; i < args.length; i++) {
        prepare = prepare.replace(":" + i + "'", args[i])
    }
    let res = eval(prepare); //I know it is kinda risky
    if (!isNaN(res)) return res //checks if result is valid
    else throw(exp + " is not a valid expression")
}

/**
 * Finds closer of bracket
 * @param list{String[]}
 * @param start{Number}
 * @returns {Number}
 */
function findEndBracket(list, start) {
    let counter = 1;
    for (let i = start + 1; i < list.length; i++) {
        if (list[i] === "[") counter++;
        else if (list[i] === "]") counter--;
        if (counter === 0) return i;
    }
    throw("Could not close [")
}

/**
 * Splits instruction list into 3 categories
 * @param list - list of instructions
 * @returns {[][]} - [Code to perform, names of functions, code of functions]
 */
function cutFunctionsOut(list) {
    let res = []
    let names = []
    let func = []
    for (let i = 0; i < list.length; i++) {
        if (list[i] === "TO") {
            i++;
            names.push(list[i])
            i++;
            let ins = []
            while (list[i] !== "END") {
                ins.push(list[i]);
                i++;
                if(i >= list.length) throw("function without end")
            }
            func.push(ins)
        } else {
            res.push(list[i])
        }
    }
    return [res, names, func]
}

const mySin = x => Math.sin((Math.PI*x)/180)
const myCos = x => Math.cos((Math.PI*x)/180)