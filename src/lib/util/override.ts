export default function override(subject: any, methodName: any, patch: any) {
    const originalMethod = subject[methodName];
    subject[methodName] = patch(originalMethod.bind(subject));
}
