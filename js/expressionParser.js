export function getGLSLFromExpression(expression) {
  const reversePolish = parse(expression);
  console.log(reversePolish);
  let result = '';

  let numberOfTempResults = 0;
  for (let i = 1; i<reversePolish.length; i++) {
    const token = reversePolish[i];

    if (isFunction(token) || isOperator(token)) {
      const numberOfArguments = getNumberOfArguments(token);

      //Get expression array and remove it from
      const expression = reversePolish.slice(i - numberOfArguments, i + 1);
      const tempResult = 'temp' + ++numberOfTempResults;

      if (isFunction(token)) {
        //const temp{number of temp result} = Complex.{functionName}(arg1, ...);
        const args = expression
          .slice(0,expression.length-1)
          .reduce((prev, cur) => {
            return prev + ', ' + cur;
          });
        result += `vec2 ${tempResult} = ${token}(${args});\n`;
      } else {
        //const temp{number of temp result} = arg1.{operatorName}(arg2);
        const arg1 = expression[0];
        const arg2 = expression[1];
        const operator = getProperOperatorName(expression[2]);
        result += `vec2 ${tempResult} = ${operator}(${arg1}, (${arg2}));\n`;
      }

      reversePolish.splice(
          i - numberOfArguments, numberOfArguments + 1, tempResult);

      i = i - numberOfArguments;
    }
  }

  //There may be no functions or operators, in which case the result will be ''
  //In this case if we only have one token then its a constant (it cant be
  //parenthesis or comma because we remove them when parsing)
  //So we output it as a result
  if (result === '') {
    if (reversePolish.length !== 1) {
      //No functions/operators, input is not only one token => error
      const errorMessage = (
        'Incorrect number of outputs. Did you forget any operators or functions?'
      );
      throw new ExpressionParsingError(errorMessage);
    } else {
      result += 'vec2 temp0 = ' + reversePolish[0] + ';\n';
    }
  }

  result += `return temp${numberOfTempResults};`;
  console.log(result);

  return result;
}

//Uses Shunting-yard algorithm
function parse(expression) {
  const output = [];
  const operators = [];

  for (const token of getTokens(expression)) {
    if (isVarOrConst(token)) {
      output.push(token);
    }

    if (isFunction(token)) {
      operators.push(token);
    }

    if (isOperator(token)) {
      let topOfStack = operators[operators.length-1];

      while (
        (
          isFunction(topOfStack) ||
          (isOperator(topOfStack) && getPrecedence(topOfStack) > getPrecedence(token)) ||
          (getPrecedence(topOfStack) === getPrecedence(token) && getAssociativity(topOfStack)==='left')
        ) && topOfStack!=='('
      ) {
        output.push(operators.pop());
        topOfStack = operators[operators.length-1];
      }

      operators.push(token);
    }

    if (token === '(') {
      operators.push(token);
    }

    if (token === ')') {
      let topOfStack;
      while ((topOfStack = operators.pop()) !== '(') {
        output.push(topOfStack);
        if (operators.length===0) {
          throw new ExpressionParsingError('Mismatched parentheses');
        }
      }
    }
  }

  while (operators.length !== 0) {
    const topOfStack = operators[operators.length-1];
    if (topOfStack==='(' || topOfStack===')') {
      throw new ExpressionParsingError('Mismatched parentheses');
    }
    output.push(operators.pop());
  }

  return output;
}

const ALPHABET = 'qwertyuiopasdfghjklzxcvbnm';
function isVarOrConst(token) {
  return isConst(token) || isVar(token);
}
function isConst(token) {
  return token.match(/vec2([\w\W]+, [\w\W]+\)/);
}
function isVar(token) {
  return token.length===1 && ALPHABET.includes(token);
}

const AVAILABLE_FUNCTIONS = ['sin', 'cos', 'neg'];
function isFunction(token) {
  return AVAILABLE_FUNCTIONS.includes(token);
}

const OPERATORS = Array.from('^*/+-');
function isOperator(token) {
  return OPERATORS.includes(token);
}
function getPrecedence(operator) {
  switch (operator) {
    case '^':
      return 2;
    case '*':
    case '/':
      return 1;
    case '+':
    case '-':
      return 0;
  }
}
function getAssociativity(operator) {
  switch (operator) {
    case '^':
      return 'right';
    default:
      return 'left';
  }
}
function getProperOperatorName(operator) {
  switch (operator) {
    case '^':
      return 'pow';
    case '*':
      return 'mul';
    case '/':
      return 'div';
    case '+':
      return 'add';
    case '-':
      return 'sub';
  }
}

//For both functions and operators
function getNumberOfArguments(token) {
  switch (token) {
    case 'sin':
    case 'cos':
    case 'neg':
      return 1;
    case 'log':
      return 2;
  }

  if (OPERATORS.includes(token)) {
    return 2;
  }
}

class ExpressionParsingError extends Error {
  constructor(message) {
    super(message);
  }
}

const AVAILABLE_TOKENS = [
  ...OPERATORS, //Higher precedence
  ...AVAILABLE_FUNCTIONS,
  '(', ')', ',',
  ...Array.from(ALPHABET) //Lower precedence (in Array.find)
];

function* getTokens(string) {
  string = removeSpaceCharacters(string);

  while (string) {
    let token = AVAILABLE_TOKENS.find(token => string.startsWith(token));

    if (!token) {
      //Token is not in available tokens array, so its a constant
      token = '' + parseFloat(string);
      if (isNaN(token)) {
        //If we cant parse a real number then its an imaginary one
        //It looks like {a;b}
        const complexNumberEndIndex = string.indexOf('}');

        if (complexNumberEndIndex === -1) {
          throw new ExpressionParsingError('Unknown token: ' + string);
        }

        const number = string.substring(1, complexNumberEndIndex); //'a;b'

        //Separate real and imaginary part, then create a new Complex object
        const separatorIndex = number.indexOf(';');
        const realPart = number.substring(0, separatorIndex);
        const imaginaryPart = (
          number.substring(separatorIndex + 1, number.length)
        );

        string = string.slice(complexNumberEndIndex + 1);
        //token = `new Complex({x: ${realPart}, y: ${imaginaryPart}})`;
        token = `vec2(${realPart}, ${imaginaryPart})`;
      } else {
        //We parsed real number, now we have to conver it to imaginary one
        string = string.slice(token.length);
        //token = `new Complex({x: ${token}, y: 0})`;
        token = `vec2(${token}, 0)`;
      }
    } else {
      //Token is one of the known constant tokens
      string = string.slice(token.length);
    }

    yield token;
  }

  return;
}
/*
for (let token of getTokens('76 + 34 + a ^ {34;45}')) {
  console.log(token);
}
*/
function removeSpaceCharacters(string) {
  let array = Array.from(string);
  array = array.filter(
      letter => (letter !== ' ') && (letter !== '\t') && (letter !== '\n'));
  return array.join('');
}
