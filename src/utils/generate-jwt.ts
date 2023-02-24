import * as jwt from 'jsonwebtoken';

const payload = {
  userId: 123,
  username: 'john.doe',
};

const secret = process.env.SECRET;

const token = jwt.sign(payload, secret, { expiresIn: '1h' });

console.log(token);
