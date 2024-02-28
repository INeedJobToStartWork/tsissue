// Types
// > Global
type TODO = any;
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type ErrorTypesCatched =
  | ErrorConstructor
  | EvalErrorConstructor
  | TypeErrorConstructor
  | RangeErrorConstructor
  | SyntaxErrorConstructor
  | ReferenceErrorConstructor;

type TMyError = {
  code?: string | number;
  message?: {
    user?: string | ((e: TODO) => unknown);
    dev?: string | ((e: TODO) => unknown);
  };
  hint?: {
    user?: string | ((e: TODO) => unknown);
    dev?: string | ((e: TODO) => unknown);
  };
};

type TMyErrorList = Record<string, TMyError>;

// > To Existing Functions
type TErrorProofOld<T> = [T, false] | [ErrorTypesCatched, true];

// > To new Functions
type TError = [TMyError, true];
type TErrorProof<T> = [T, false] | TError;

// FUNCTIONS

// > To Handle Error on EXIST FUNCTIONS
const MyWrapperHandler =
  <T extends (...args: any[]) => any>(fnThatMayThrow: T) =>
  (...args: Parameters<T>): [ReturnType<T>, false] | [ErrorTypesCatched, true] => {
    try {
      const result = fnThatMayThrow(...args);
      return [result, false];
    } catch (error) {
      // Maybe additional - more detailed handler
      return [error as ErrorTypesCatched, true];
    }
  };
const MyWrapperCatcher =
  <T extends (...args: any[]) => any>(fnThatMayThrow: T) =>
  (...args: Parameters<T>): Promise<Prettify<ReturnType<T>>> =>
    new Promise((resolve) => {
      resolve(fnThatMayThrow(...args));
    });

// > To BUILD ERROR HANDLING in new Functions

// EXAMPLES

// > Handle Error with Existing Function - MyWrapperHandler
import { readFileSync, existsSync } from "node:fs";

function main1() {
  const [data, error] = MyWrapperHandler(readFileSync)("./MyFile.txt");

  if (error) {
    console.error("Error: Can't Load Config.");
    console.error("HINT: Check path is valid or file exist.");
    process.exit(1);
  }
  const config = data;
  console.log(`Config Loaded \n${config}`);
}

// > Handle Error with Existing Function - MyErrorCatcher

async function main2() {
  const config = await MyWrapperCatcher(readFileSync)("./MyFile.txt").catch((error: ErrorTypesCatched) => {
    console.error("Error: Can't Load Config.");
    console.error("HINT: Check path is valid or file exist.");
    process.exit(1);
  });

  console.log(`Config Loaded \n${config}`);
}

// > Create and handle errors in new Functions

const MyReadFileErrors: TMyErrorList = {
  FileNotFound: {
    code: "FS001",
    message: {
      user: "File not exist or couldn't be found",
      dev: `existsSync not found file.`,
    },
    hint: {
      user: "Check path and file existing.",
    },
  },
  CouldntRead: {
    code: "FS002",
    message: {
      user: "File couldnt be readed",
      dev: `readFileSync throw Error`,
    },
    hint: {
      user: "Check permissions granted on this file",
      dev: "Probably no permissions to file, check it by xxx",
    },
  },
};

type TMyReadFileReturn = TErrorProof<ReturnType<typeof readFileSync>>;

// const MyReadFile = async  (filePath:string): Promise<TMyReadFileReturn> => {
const MyReadFile = async (filePath: string): Promise<Prettify<TErrorProof<ReturnType<typeof readFileSync>>>> => {
  if (!existsSync(filePath)) return [MyReadFileErrors["FileNotFound"], true];
  const data = await MyWrapperCatcher(readFileSync)(filePath).catch(
    (): TError => [MyReadFileErrors["CouldntRead"], true]
  );

  if (Array.isArray(data)) return data;

  return [data, false];
};

async function main3() {
  const [data, error] = await MyReadFile("./MyFile.txt");

  if (error) {
    if (data.message && "user" in data.message) console.error("Error:", data.message?.user);
    if (data.hint && "user" in data.hint) console.error("HINT:", data.hint?.user);
    process.exit(1);
  }
  const config = data;
  console.log(`Config Loaded \n${config}`);
}

main1();
