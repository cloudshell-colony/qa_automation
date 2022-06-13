import crypto from "crypto";

export const generateSecret = (email, account) => {
    let md5sum = crypto.createHash('md5');
        md5sum.update((email + account), "utf-8");
        return md5sum.digest('hex').toUpperCase();
};



export default generateSecret;
// console.log(`testing my secret generator ${generateSecret("abc", "dcd")}`);