//This function generates a 128 character long random string
export async function getWebhookURLPart():Promise<string> {
    let randomStringElements = [];
    for(let i = 0; i < 128; i++) {
        const randomChar = Math.floor(Math.random() * 36).toString(36);
        randomStringElements.push(randomChar);
    }
    const randomString = randomStringElements.join('');
    return randomString
}