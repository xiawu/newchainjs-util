const createKeccakHash = require('keccak')
const EC = require('elliptic').ec
const ec = new EC('p256')
const assert = require('assert')
const rlp = require('rlp')
const BN = require('bn.js')
const createHash = require('create-hash')
const Buffer = require('safe-buffer').Buffer
Object.assign(exports, require('ethjs-util'))

/**
 * the max integer that this VM can handle (a ```BN```)
 * @var {BN} MAX_INTEGER
 */
exports.MAX_INTEGER = new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16)

/**
 * 2^256 (a ```BN```)
 * @var {BN} TWO_POW256
 */
exports.TWO_POW256 = new BN('10000000000000000000000000000000000000000000000000000000000000000', 16)

/**
 * Keccak-256 hash of null (a ```String```)
 * @var {String} KECCAK256_NULL_S
 */
exports.KECCAK256_NULL_S = 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'

/**
 * Keccak-256 hash of null (a ```Buffer```)
 * @var {Buffer} KECCAK256_NULL
 */
exports.KECCAK256_NULL = Buffer.from(exports.KECCAK256_NULL_S, 'hex')

/**
 * Keccak-256 of an RLP of an empty array (a ```String```)
 * @var {String} KECCAK256_RLP_ARRAY_S
 */
exports.KECCAK256_RLP_ARRAY_S = '1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347'

/**
 * Keccak-256 of an RLP of an empty array (a ```Buffer```)
 * @var {Buffer} KECCAK256_RLP_ARRAY
 */
exports.KECCAK256_RLP_ARRAY = Buffer.from(exports.KECCAK256_RLP_ARRAY_S, 'hex')

/**
 * Keccak-256 hash of the RLP of null  (a ```String```)
 * @var {String} KECCAK256_RLP_S
 */
exports.KECCAK256_RLP_S = '56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'

/**
 * Keccak-256 hash of the RLP of null (a ```Buffer```)
 * @var {Buffer} KECCAK256_RLP
 */
exports.KECCAK256_RLP = Buffer.from(exports.KECCAK256_RLP_S, 'hex')

/**
 * [`BN`](https://github.com/indutny/bn.js)
 * @var {Function}
 */
exports.BN = BN

/**
 * [`rlp`](https://github.com/ethereumjs/rlp)
 * @var {Function}
 */
exports.rlp = rlp

/**
 * Returns a buffer filled with 0s
 * @method zeros
 * @param {Number} bytes  the number of bytes the buffer should be
 * @return {Buffer}
 */
exports.zeros = function (bytes) {
  return Buffer.allocUnsafe(bytes).fill(0)
}

/**
  * Returns a zero address
  * @method zeroAddress
  * @return {String}
  */
exports.zeroAddress = function () {
  const addressLength = 20
  const zeroAddress = exports.zeros(addressLength)
  return exports.bufferToHex(zeroAddress)
}

/**
 * Left Pads an `Array` or `Buffer` with leading zeros till it has `length` bytes.
 * Or it truncates the beginning if it exceeds.
 * @method setLengthLeft
 * @param {Buffer|Array} msg the value to pad
 * @param {Number} length the number of bytes the output should be
 * @param {Boolean} [right=false] whether to start padding form the left or right
 * @return {Buffer|Array}
 */
exports.setLengthLeft = exports.setLength = function (msg, length, right) {
  const buf = exports.zeros(length)
  msg = exports.toBuffer(msg)
  if (right) {
    if (msg.length < length) {
      msg.copy(buf)
      return buf
    }
    return msg.slice(0, length)
  } else {
    if (msg.length < length) {
      msg.copy(buf, length - msg.length)
      return buf
    }
    return msg.slice(-length)
  }
}

/**
 * Right Pads an `Array` or `Buffer` with leading zeros till it has `length` bytes.
 * Or it truncates the beginning if it exceeds.
 * @param {Buffer|Array} msg the value to pad
 * @param {Number} length the number of bytes the output should be
 * @return {Buffer|Array}
 */
exports.setLengthRight = function (msg, length) {
  return exports.setLength(msg, length, true)
}

/**
 * Trims leading zeros from a `Buffer` or an `Array`
 * @param {Buffer|Array|String} a
 * @return {Buffer|Array|String}
 */
exports.unpad = exports.stripZeros = function (a) {
  a = exports.stripHexPrefix(a)
  let first = a[0]
  while (a.length > 0 && first.toString() === '0') {
    a = a.slice(1)
    first = a[0]
  }
  return a
}
/**
 * Attempts to turn a value into a `Buffer`. As input it supports `Buffer`, `String`, `Number`, null/undefined, `BN` and other objects with a `toArray()` method.
 * @param {*} v the value
 */
exports.toBuffer = function (v) {
  if (!Buffer.isBuffer(v)) {
    if (Array.isArray(v)) {
      v = Buffer.from(v)
    } else if (typeof v === 'string') {
      if (exports.isHexString(v)) {
        v = Buffer.from(exports.padToEven(exports.stripHexPrefix(v)), 'hex')
      } else {
        v = Buffer.from(v)
      }
    } else if (typeof v === 'number') {
      v = exports.intToBuffer(v)
    } else if (v === null || v === undefined) {
      v = Buffer.allocUnsafe(0)
    } else if (BN.isBN(v)) {
      v = v.toArrayLike(Buffer)
    } else if (v.toArray) {
      // converts a BN to a Buffer
      v = Buffer.from(v.toArray())
    } else {
      throw new Error('invalid type')
    }
  }
  return v
}

/**
 * Converts a `Buffer` to a `Number`
 * @param {Buffer} buf
 * @return {Number}
 * @throws If the input number exceeds 53 bits.
 */
exports.bufferToInt = function (buf) {
  return new BN(exports.toBuffer(buf)).toNumber()
}

/**
 * Converts a `Buffer` into a hex `String`
 * @param {Buffer} buf
 * @return {String}
 */
exports.bufferToHex = function (buf) {
  buf = exports.toBuffer(buf)
  return '0x' + buf.toString('hex')
}

/**
 * Interprets a `Buffer` as a signed integer and returns a `BN`. Assumes 256-bit numbers.
 * @param {Buffer} num
 * @return {BN}
 */
exports.fromSigned = function (num) {
  return new BN(num).fromTwos(256)
}

/**
 * Converts a `BN` to an unsigned integer and returns it as a `Buffer`. Assumes 256-bit numbers.
 * @param {BN} num
 * @return {Buffer}
 */
exports.toUnsigned = function (num) {
  return Buffer.from(num.toTwos(256).toArray())
}

/**
 * Creates Keccak hash of the input
 * @param {Buffer|Array|String|Number} a the input data
 * @param {Number} [bits=256] the Keccak width
 * @return {Buffer}
 */
exports.keccak = function (a, bits) {
  a = exports.toBuffer(a)
  if (!bits) bits = 256

  return createKeccakHash('keccak' + bits).update(a).digest()
}

/**
 * Creates Keccak-256 hash of the input, alias for keccak(a, 256)
 * @param {Buffer|Array|String|Number} a the input data
 * @return {Buffer}
 */
exports.keccak256 = function (a) {
  return exports.keccak(a)
}

/**
 * Creates SHA-3 (Keccak) hash of the input [OBSOLETE]
 * @param {Buffer|Array|String|Number} a the input data
 * @param {Number} [bits=256] the SHA-3 width
 * @return {Buffer}
 */
exports.sha3 = exports.keccak

/**
 * Creates SHA256 hash of the input
 * @param {Buffer|Array|String|Number} a the input data
 * @return {Buffer}
 */
exports.sha256 = function (a) {
  a = exports.toBuffer(a)
  return createHash('sha256').update(a).digest()
}

/**
 * Creates RIPEMD160 hash of the input
 * @param {Buffer|Array|String|Number} a the input data
 * @param {Boolean} padded whether it should be padded to 256 bits or not
 * @return {Buffer}
 */
exports.ripemd160 = function (a, padded) {
  a = exports.toBuffer(a)
  const hash = createHash('rmd160').update(a).digest()
  if (padded === true) {
    return exports.setLength(hash, 32)
  } else {
    return hash
  }
}

/**
 * Creates SHA-3 hash of the RLP encoded version of the input
 * @param {Buffer|Array|String|Number} a the input data
 * @return {Buffer}
 */
exports.rlphash = function (a) {
  return exports.keccak(rlp.encode(a))
}

/**
 * Checks if the private key satisfies the rules of the curve secp256r1.
 * @param {Buffer} privateKey
 * @return {Boolean}
 */
exports.isValidPrivate = function (privateKey) {
  var bn = new BN(privateKey)
  return privateKey.length === 32 && !bn.isZero() && bn.cmp(ec.n) < 0
}

/**
 * Checks if the public key satisfies the rules of the curve secp256r1
 * and the requirements of Ethereum.
 * @param {Buffer} publicKey The two points of an uncompressed key, unless sanitize is enabled
 * @param {Boolean} [sanitize=false] Accept public keys in other formats
 * @return {Boolean}
 */
exports.isValidPublic = function (publicKey, sanitize) {
  if (publicKey.length === 64) {
    // Convert to SEC1 for secp256r1
    return ec.keyFromPublic(Buffer.concat([ Buffer.from([4]), publicKey ])).validate().result
  }

  if (!sanitize) {
    return false
  }
  try {
    return ec.keyFromPublic(publicKey).validate().result
  } catch (e) {
    return false
  }
}

/**
 * Returns the ethereum address of a given public key.
 * Accepts "Ethereum public keys" and SEC1 encoded keys.
 * @param {Buffer} pubKey The two points of an uncompressed key, unless sanitize is enabled
 * @param {Boolean} [sanitize=false] Accept public keys in other formats
 * @return {Buffer}
 */
exports.pubToAddress = exports.publicToAddress = function (pubKey, sanitize) {
  pubKey = exports.toBuffer(pubKey)
  if (sanitize && (pubKey.length !== 64)) {
    var publicKeyObject = ec.keyFromPublic(pubKey).getPublic(null, false)
    var x = publicKeyObject.getX()
    var y = publicKeyObject.getY()
    pubKey = Buffer.alloc(64)
    exports.toBuffer(x).copy(pubKey, 0)
    exports.toBuffer(y).copy(pubKey, 32)
  }
  assert(pubKey.length === 64)
  // Only take the lower 160bits of the hash
  return exports.keccak(pubKey).slice(-20)
}

/**
 * Returns the ethereum public key of a given private key
 * @param {Buffer} privateKey A private key must be 256 bits wide
 * @return {Buffer}
 */
const privateToPublic = exports.privateToPublic = function (privateKey) {
  privateKey = exports.toBuffer(privateKey)
  var publicKeyObject = ec.keyFromPrivate(privateKey).getPublic(null, false)
  var x = publicKeyObject.getX()
  var y = publicKeyObject.getY()
  var publicKey = Buffer.alloc(64)
  exports.toBuffer(x).copy(publicKey, 0)
  exports.toBuffer(y).copy(publicKey, 32)
  return publicKey
}

/**
 * Converts a public key to the Ethereum format.
 * @param {Buffer} publicKey
 * @return {Buffer}
 */
exports.importPublic = function (publicKey) {
  publicKey = exports.toBuffer(publicKey)
  if (publicKey.length !== 64) {
    var publicKeyObject = ec.keyFromPublic(publicKey).getPublic(null, false)
    var x = publicKeyObject.getX()
    var y = publicKeyObject.getY()
    publicKey = Buffer.alloc(64)
    exports.toBuffer(x).copy(publicKey, 0)
    exports.toBuffer(y).copy(publicKey, 32)
  }
  return publicKey
}

/**
 * ECDSA sign
 * @param {Buffer} msgHash
 * @param {Buffer} privateKey
 * @param {Number} [chainId]
 * @return {Object}
 */
exports.ecsign = function (msgHash, privateKey, chainId) {
  var SECP256R1_N_DIV_2 = new BN('7fffffff800000007fffffffffffffffde737d56d38bcf4279dce5617e3192a8', 16)
  var SECP256R1_N = new BN('ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551', 16)

  const sig = ec.sign(msgHash, privateKey)
  const ret = {}
  ret.r = exports.toBuffer(sig.r)
  if (sig.s.cmp(SECP256R1_N_DIV_2) === 1) {
    sig.s = SECP256R1_N.sub(sig.s)
    sig.recoveryParam = sig.recoveryParam === 1 ? 0 : 1
  }
  ret.s = exports.toBuffer(sig.s)
  ret.v = chainId ? sig.recoveryParam + (chainId * 2 + 35) : sig.recoveryParam + 27
  return ret
}

/**
 * Returns the keccak-256 hash of `message`, prefixed with the header used by the `eth_sign` RPC call.
 * The output of this function can be fed into `ecsign` to produce the same signature as the `eth_sign`
 * call for a given `message`, or fed to `ecrecover` along with a signature to recover the public key
 * used to produce the signature.
 * @param message
 * @returns {Buffer} hash
 */
exports.hashPersonalMessage = function (message) {
  const prefix = exports.toBuffer('\u0019Ethereum Signed Message:\n' + message.length.toString())
  return exports.keccak(Buffer.concat([prefix, message]))
}

/**
 * ECDSA public key recovery from signature
 * @param {Buffer} msgHash
 * @param {Number} v
 * @param {Buffer} r
 * @param {Buffer} s
 * @param {Number} [chainId]
 * @return {Buffer} publicKey
 */
exports.ecrecover = function (msgHash, v, r, s, chainId) {
  const signature = { r: exports.setLength(r, 32), s: exports.setLength(s, 32) }
  const recovery = calculateSigRecovery(v, chainId)
  if (!isValidSigRecovery(recovery)) {
    throw new Error('Invalid signature v value')
  }
  const publicKeyObject = ec.recoverPubKey(msgHash, signature, recovery)
  var x = publicKeyObject.getX()
  var y = publicKeyObject.getY()
  var pubKey = Buffer.alloc(64)
  exports.toBuffer(x).copy(pubKey, 0)
  exports.toBuffer(y).copy(pubKey, 32)
  return pubKey
}

/**
 * Convert signature parameters into the format of `eth_sign` RPC method
 * @param {Number} v
 * @param {Buffer} r
 * @param {Buffer} s
 * @param {Number} [chainId]
 * @return {String} sig
 */
exports.toRpcSig = function (v, r, s, chainId) {
  let recovery = calculateSigRecovery(v, chainId)
  if (!isValidSigRecovery(recovery)) {
    throw new Error('Invalid signature v value')
  }

  // geth (and the RPC eth_sign method) uses the 65 byte format used by Bitcoin
  return exports.bufferToHex(Buffer.concat([
    exports.setLengthLeft(r, 32),
    exports.setLengthLeft(s, 32),
    exports.toBuffer(v)
  ]))
}

/**
 * Convert signature format of the `eth_sign` RPC method to signature parameters
 * NOTE: all because of a bug in geth: https://github.com/ethereum/go-ethereum/issues/2053
 * @param {String} sig
 * @return {Object}
 */
exports.fromRpcSig = function (sig) {
  sig = exports.toBuffer(sig)

  // NOTE: with potential introduction of chainId this might need to be updated
  if (sig.length !== 65) {
    throw new Error('Invalid signature length')
  }

  let v = sig[64]
  // support both versions of `eth_sign` responses
  if (v < 27) {
    v += 27
  }

  return {
    v: v,
    r: sig.slice(0, 32),
    s: sig.slice(32, 64)
  }
}

/**
 * Returns the ethereum address of a given private key
 * @param {Buffer} privateKey A private key must be 256 bits wide
 * @return {Buffer}
 */
exports.privateToAddress = function (privateKey) {
  return exports.publicToAddress(privateToPublic(privateKey))
}

/**
 * Checks if the address is a valid. Accepts checksummed addresses too
 * @param {String} address
 * @return {Boolean}
 */
exports.isValidAddress = function (address) {
  return /^0x[0-9a-fA-F]{40}$/.test(address)
}

/**
  * Checks if a given address is a zero address
  * @method isZeroAddress
  * @param {String} address
  * @return {Boolean}
  */
exports.isZeroAddress = function (address) {
  const zeroAddress = exports.zeroAddress()
  return zeroAddress === exports.addHexPrefix(address)
}

/**
 * Returns a checksummed address
 * @param {String} address
 * @return {String}
 */
exports.toChecksumAddress = function (address) {
  address = exports.stripHexPrefix(address).toLowerCase()
  const hash = exports.keccak(address).toString('hex')
  let ret = '0x'

  for (let i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase()
    } else {
      ret += address[i]
    }
  }

  return ret
}

/**
 * Checks if the address is a valid checksummed address
 * @param {Buffer} address
 * @return {Boolean}
 */
exports.isValidChecksumAddress = function (address) {
  return exports.isValidAddress(address) && (exports.toChecksumAddress(address) === address)
}

/**
 * Generates an address of a newly created contract
 * @param {Buffer} from the address which is creating this new address
 * @param {Buffer} nonce the nonce of the from account
 * @return {Buffer}
 */
exports.generateAddress = function (from, nonce) {
  from = exports.toBuffer(from)
  nonce = new BN(nonce)

  if (nonce.isZero()) {
    // in RLP we want to encode null in the case of zero nonce
    // read the RLP documentation for an answer if you dare
    nonce = null
  } else {
    nonce = Buffer.from(nonce.toArray())
  }

  // Only take the lower 160bits of the hash
  return exports.rlphash([from, nonce]).slice(-20)
}

/**
 * Generates an address for a contract created using CREATE2
 * @param {Buffer} from the address which is creating this new address
 * @param {Buffer} salt a salt
 * @param {Buffer} initCode the init code of the contract being created
 * @return {Buffer}
 */
exports.generateAddress2 = function (from, salt, initCode) {
  from = exports.toBuffer(from)
  salt = exports.toBuffer(salt)
  initCode = exports.toBuffer(initCode)

  assert(from.length === 20)
  assert(salt.length === 32)

  let address = exports.keccak256(Buffer.concat([
    Buffer.from('ff', 'hex'),
    from,
    salt,
    exports.keccak256(initCode)
  ]))

  return address.slice(-20)
}

/**
 * Returns true if the supplied address belongs to a precompiled account (Byzantium)
 * @param {Buffer|String} address
 * @return {Boolean}
 */
exports.isPrecompiled = function (address) {
  const a = exports.unpad(address)
  return a.length === 1 && a[0] >= 1 && a[0] <= 8
}

/**
 * Adds "0x" to a given `String` if it does not already start with "0x"
 * @param {String} str
 * @return {String}
 */
exports.addHexPrefix = function (str) {
  if (typeof str !== 'string') {
    return str
  }

  return exports.isHexPrefixed(str) ? str : '0x' + str
}

/**
 * Validate ECDSA signature
 * @method isValidSignature
 * @param {Buffer} v
 * @param {Buffer} r
 * @param {Buffer} s
 * @param {Boolean} [homestead=true]
 * @param {Number} [chainId]
 * @return {Boolean}
 */

exports.isValidSignature = function (v, r, s, homestead, chainId) {
  const SECP256R1_N_DIV_2 = new BN('7fffffff800000007fffffffffffffffde737d56d38bcf4279dce5617e3192a8', 16)
  const SECP256R1_N = new BN('ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551', 16)

  if (r.length !== 32 || s.length !== 32) {
    return false
  }

  if (!isValidSigRecovery(calculateSigRecovery(v, chainId))) {
    return false
  }

  r = new BN(r)
  s = new BN(s)

  if (r.isZero() || r.gt(SECP256R1_N) || s.isZero() || s.gt(SECP256R1_N)) {
    return false
  }

  if ((homestead === false) && (new BN(s).cmp(SECP256R1_N_DIV_2) === 1)) {
    return false
  }

  return true
}

/**
 * Converts a `Buffer` or `Array` to JSON
 * @param {Buffer|Array} ba
 * @return {Array|String|null}
 */
exports.baToJSON = function (ba) {
  if (Buffer.isBuffer(ba)) {
    return '0x' + ba.toString('hex')
  } else if (ba instanceof Array) {
    const array = []
    for (let i = 0; i < ba.length; i++) {
      array.push(exports.baToJSON(ba[i]))
    }
    return array
  }
}

/**
 * Defines properties on a `Object`. It make the assumption that underlying data is binary.
 * @param {Object} self the `Object` to define properties on
 * @param {Array} fields an array fields to define. Fields can contain:
 * * `name` - the name of the properties
 * * `length` - the number of bytes the field can have
 * * `allowLess` - if the field can be less than the length
 * * `allowEmpty`
 * @param {*} data data to be validated against the definitions
 */
exports.defineProperties = function (self, fields, data) {
  self.raw = []
  self._fields = []

  // attach the `toJSON`
  self.toJSON = function (label) {
    if (label) {
      const obj = {}
      self._fields.forEach((field) => {
        obj[field] = '0x' + self[field].toString('hex')
      })
      return obj
    }
    return exports.baToJSON(this.raw)
  }

  self.serialize = function serialize () {
    return rlp.encode(self.raw)
  }

  fields.forEach((field, i) => {
    self._fields.push(field.name)
    function getter () {
      return self.raw[i]
    }
    function setter (v) {
      v = exports.toBuffer(v)

      if (v.toString('hex') === '00' && !field.allowZero) {
        v = Buffer.allocUnsafe(0)
      }

      if (field.allowLess && field.length) {
        v = exports.stripZeros(v)
        assert(field.length >= v.length, 'The field ' + field.name + ' must not have more ' + field.length + ' bytes')
      } else if (!(field.allowZero && v.length === 0) && field.length) {
        assert(field.length === v.length, 'The field ' + field.name + ' must have byte length of ' + field.length)
      }

      self.raw[i] = v
    }

    Object.defineProperty(self, field.name, {
      enumerable: true,
      configurable: true,
      get: getter,
      set: setter
    })

    if (field.default) {
      self[field.name] = field.default
    }

    // attach alias
    if (field.alias) {
      Object.defineProperty(self, field.alias, {
        enumerable: false,
        configurable: true,
        set: setter,
        get: getter
      })
    }
  })

  // if the constuctor is passed data
  if (data) {
    if (typeof data === 'string') {
      data = Buffer.from(exports.stripHexPrefix(data), 'hex')
    }

    if (Buffer.isBuffer(data)) {
      data = rlp.decode(data)
    }

    if (Array.isArray(data)) {
      if (data.length > self._fields.length) {
        throw (new Error('wrong number of fields in data'))
      }

      // make sure all the items are buffers
      data.forEach((d, i) => {
        self[self._fields[i]] = exports.toBuffer(d)
      })
    } else if (typeof data === 'object') {
      const keys = Object.keys(data)
      fields.forEach((field) => {
        if (keys.indexOf(field.name) !== -1) self[field.name] = data[field.name]
        if (keys.indexOf(field.alias) !== -1) self[field.alias] = data[field.alias]
      })
    } else {
      throw new Error('invalid data')
    }
  }
}

function calculateSigRecovery (v, chainId) {
  return chainId ? v - (2 * chainId + 35) : v - 27
}

function isValidSigRecovery (recovery) {
  return recovery === 0 || recovery === 1
}
