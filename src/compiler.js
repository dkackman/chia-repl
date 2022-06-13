import { Program } from '@rigidity/clvm';
import { getSource } from './source.js';

class Compiler {
    constructor(include) {
        this.include = include;
    }

    run(source) {
        const src = getSource(source);
        //const options = 
        return Program.fromSource(src).compile().value.toString();
    }

    brun(source, environment) {
        const src = getSource(source);
        const env = getSource(environment);
    
        return Program.fromSource(src).run(Program.fromSource(env)).value.toString();
    }

    compile(source, solution = '()') {
        const src = getSource(source);        
        const solutionSrc = getSource(solution);
        const puzzleProgram = Program.fromSource(src);
        const output = puzzleProgram.compile();
        //const solutionProgram = Program.fromSource(solutionSrc);
        //const result = puzzleProgram.run();

        return {
            puzzleProgram: puzzleProgram,
            //solutionProgram: solutionProgram,
            //result: result,
            source: puzzleProgram.toSource(true),
            clvm: output.value.toString(),
            cost: output.cost,
            puzzle: puzzleProgram.serializeHex(),
            //solution: solutionProgram.serializeHex(),
        };
    }
}

//const src = '(mod ARGUMENT (+ ARGUMENT 3))';//readFileSync('C:\\Users\\dkack\\src\\github\\dkackman\\chia-repl\\examples\\factorial.clsp');

/*
brun is Program.fromSource(source).run(Program.fromSource(environment)).value.toString()
and run is Program.fromSource(input).compile().value.toString()
opc would be Program.fromSource(source).serializeHex()
and opd is Program.deserializeHex(hex).toString()
*/

const _Compiler = Compiler;
export { _Compiler as Compiler };