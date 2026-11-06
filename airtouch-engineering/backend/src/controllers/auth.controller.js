import AuthService from '../services/auth.service.js'
import AccountService from '../services/account.service.js'
import AddressService from '../services/address.service.js'

/**
 * AirTouch Engineering - Customer Authentication & Account Controller
 * Thin HTTP request handlers that invoke Service layer methods.
 * Contains zero direct Supabase queries or secrets.
 */

export const requestOtp = async (req, res, next) => {
  try {
    const result = await AuthService.requestOtp(req.body.email)
    return res.status(200).json({
      message: result.message || 'If that email is valid, a code has been sent.',
    })
  } catch (err) {
    next(err)
  }
}

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, code, token } = req.body
    const result = await AuthService.verifyOtp(email, code || token)

    return res.status(200).json({
      session: result.session,
      user: result.user,
      isNewUser: result.isNewUser,
    })
  } catch (err) {
    next(err)
  }
}

export const startGoogle = async (req, res, next) => {
  try {
    const redirectTo = req.query.redirectTo || req.query.redirect_to
    const { url } = await AuthService.getGoogleAuthUrl(redirectTo)

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(200).json({ url })
    }

    return res.redirect(url)
  } catch (err) {
    next(err)
  }
}

export const ensureProfile = async (req, res, next) => {
  try {
    const { profile, isNewUser } = await AuthService.ensureProfile(req.user)

    return res.status(200).json({
      profile,
      isNewUser,
      user: {
        id: req.user.id,
        email: profile?.email || req.user.email,
        fullName: profile?.full_name || null,
        mobile: profile?.mobile || null,
        role: profile?.role || 'customer',
      },
    })
  } catch (err) {
    next(err)
  }
}

export const passwordLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await AuthService.passwordLogin(email, password)

    return res.status(200).json({
      session: result.session,
      user: result.user,
      isNewUser: false,
    })
  } catch (err) {
    next(err)
  }
}

export const logout = async (req, res, next) => {
  try {
    await AuthService.logout(req.accessToken)
    return res.status(200).json({
      message: 'Logged out successfully.',
    })
  } catch (err) {
    next(err)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const data = await AuthService.getCurrentUser(req.accessToken)
    return res.status(200).json({
      user: data.user,
      profile: data.profile,
      profileComplete: data.profileComplete,
    })
  } catch (err) {
    next(err)
  }
}

export const updateMe = async (req, res, next) => {
  try {
    const updatedProfile = await AuthService.updateProfile(req.user.id, {
      fullName: req.body.full_name || req.body.fullName,
      mobile: req.body.mobile,
    })

    return res.status(200).json({
      message: 'Profile updated successfully.',
      profile: updatedProfile,
      user: {
        id: req.user.id,
        email: updatedProfile?.email || req.user.email,
        fullName: updatedProfile?.full_name || null,
        mobile: updatedProfile?.mobile || null,
        role: updatedProfile?.role || 'customer',
      },
    })
  } catch (err) {
    next(err)
  }
}

// -----------------------------------------------------------------------------
// Customer Account & Delivery Address Handlers
// -----------------------------------------------------------------------------

export const createAccount = async (req, res, next) => {
  try {
    const result = await AccountService.createAccount(req.user.id, {
      fullName: req.body.fullName || req.body.full_name,
      mobile: req.body.mobile,
      password: req.body.password,
      address: req.body.address,
    })

    return res.status(201).json({
      message: 'Account created successfully.',
      profile: result.profile,
      address: result.address,
      profileComplete: true,
    })
  } catch (err) {
    next(err)
  }
}

export const getAccount = async (req, res, next) => {
  try {
    const data = await AccountService.getAccount(req.user.id)
    return res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

export const updateAccount = async (req, res, next) => {
  try {
    const updatedProfile = await AccountService.updateAccount(req.user.id, {
      fullName: req.body.fullName || req.body.full_name,
      mobile: req.body.mobile,
    })

    return res.status(200).json({
      message: 'Account updated successfully.',
      profile: updatedProfile,
    })
  } catch (err) {
    next(err)
  }
}

export const listAddresses = async (req, res, next) => {
  try {
    const addresses = await AddressService.listAddresses(req.user.id)
    return res.status(200).json({ addresses })
  } catch (err) {
    next(err)
  }
}

export const createAddress = async (req, res, next) => {
  try {
    const address = await AddressService.createAddress(req.user.id, req.body)
    return res.status(201).json({
      message: 'Address added successfully.',
      address,
    })
  } catch (err) {
    next(err)
  }
}

export const updateAddress = async (req, res, next) => {
  try {
    const address = await AddressService.updateAddress(req.user.id, req.params.id, req.body)
    return res.status(200).json({
      message: 'Address updated successfully.',
      address,
    })
  } catch (err) {
    next(err)
  }
}

export const deleteAddress = async (req, res, next) => {
  try {
    const result = await AddressService.deleteAddress(req.user.id, req.params.id)
    return res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export default {
  requestOtp,
  verifyOtp,
  startGoogle,
  ensureProfile,
  passwordLogin,
  logout,
  getMe,
  updateMe,
  createAccount,
  getAccount,
  updateAccount,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
}
