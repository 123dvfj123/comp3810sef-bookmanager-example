// The course example uses a server-provided account list instead of a User
// collection. These accounts are only for teaching/demo purposes.
const users = [
  {
    username: 'student01',
    password: 'demo123',
    displayName: 'Chan Tai Man',
  },
  {
    username: 'student02',
    password: 'demo123',
    displayName: 'Lee Siu Ming',
  },
];

// Direct comparison is used here because this is a classroom demonstration.
// In a real application, store password hashes (for example with bcrypt) and
// compare hashes instead of plaintext passwords.
function findUser(username, password) {
  const normalizedUsername = String(username || '').trim();

  return (
    users.find(
      (user) =>
        user.username === normalizedUsername && user.password === password
    ) || null
  );
}

module.exports = { users, findUser };