const CHARACTERS = "abcdefghijklmnopqrstuvwxyz0123456789";

function makeid(length: number) {
    return Array.apply<any, any, any>(null, { length }).map(Number.call, Number)
        .map(() => CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length)))
        .join("");
 }

export const generateGameId = () => makeid(6);