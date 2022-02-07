export default function generateFileStamp() {
    const now = new Date()
    return `${now.getFullYear()}${`0${now.getMonth() + 1}`.slice(-2)}${now.getDate()}-${Math.random()
        .toString(36)
        .slice(6, 13)}`
}
