'use strict'
import mongoose from 'mongoose'
const { Schema } = mongoose
import { generateJwt, encrypt, generateOtpNew, max_otp_attempt_count,otp_resend, decrypt} from '../../utility/index.js'
import { saveAuthToken } from '../auth_tokens/schema.js'
import moment from 'moment';
import fs from 'fs';
import path from 'path';

const otpSchema = new Schema({
  _id: false,
  value: {
    type: Number,
    required: false
  },
  expiry_datetime: {
    type: Date,
    required: false
  },
  resend_datetime: {
    type: Date,
    required: false
  },
  attempt_count: {
    type: Number,
    required: false,
    max: [
      max_otp_attempt_count,
      `You Cannot Attempt More than ${max_otp_attempt_count} times`
    ],
    min: 0
  },
  block_datetime: {
    type: Date,
    required: false
  }
})

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'User Full name required'],
      trim: true,
      match: [
        /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/,
        'Invalid User Name format'
      ]
    },
    email: {
      type: String,
      required: [true, 'User Email is Required.'],
      immutable: true,
      trim: true,
      index: true,
      lowercase: true,
      validate: {
        validator: async function (email) {
		  const user = await mongoose.model('User').findOne({ email })
		  return !user || this.id === user.id
        },
        message: props => `The ${props.value} is already in use as Email Address.`
      },
      match: [/\S+@\S+\.\S+/, 'Invalid email format'],
      context: true
    },
	profile_image: {
		type: String,
		required: false,
		default: '',
	},
    password: {
      type: String,
      required: [true, 'Password is Required.']
    },
    email_verify_otp: {
      type: otpSchema,
      required: false
    },
    status: {
      type: String,
      requred: false,
      enum: ['P', 'A', 'AR'], // A => Active, AR => Archive, P => Pending
      uppercase: true,
      default: 'P'
    }
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'user'
  }
)

export const UserModel = mongoose.model('User', userSchema)

const addUserProfileImage = async (ls_userFileName) => {
    const la_fileRelativePath = ls_userFileName.split('/');
    const ls_fileName = la_fileRelativePath.slice(-1)[0];

	const ls_imagePath = `/public/avatar/${ls_fileName}`;
	const ls_tempPath = `/public/temp/${ls_fileName}`;
    const __dirname = path.resolve();

	if (!fs.existsSync(path.join(__dirname, ls_tempPath))) {
		throw new Error('File does not exist');
	}
	fs.rename(path.join(__dirname, ls_tempPath), path.join(__dirname, ls_imagePath), function (err) {
		if (err) throw err;
	});
	
    return ls_imagePath;
}
export const addNewUser = async form => {
	const { email, name, password, profile_image = '' } = form;
	if (!email || !name || !password) {
		throw new Error('Email, Name, and Password are required');
	}
	
	const lo_user = await UserModel(form)
	lo_user.password = encrypt(form.password);
	const lo_emailOtp = await generateOtpNew(0)
	lo_user.email_verify_otp = lo_emailOtp;

    let lo_savedUser = await lo_user.save();
	
	if (lo_savedUser) {
		// send mail
		lo_savedUser = lo_savedUser.toObject();
		delete lo_savedUser.password;
		delete lo_savedUser.email_verify_otp;
		return lo_savedUser
	}
}
export const resendOTPForExistingUser = async form => {
	const { email } = form;
	if (!email) {
		throw new Error('Email are required');
	}
	
	const lo_existingUser = await UserModel.findOne({
		email: email.trim().toLowerCase()
	})
	if(!lo_existingUser) {
		throw new Error("No User found with this Email.")
	} 

    if (
        lo_existingUser?.email_verify_otp?.block_datetime && // checking exists
        lo_existingUser?.email_verify_otp?.block_datetime > moment().toDate() && // checking current datetime is within the block_datetime
        lo_existingUser?.email_verify_otp?.attempt_count >= max_otp_attempt_count // checking the attempt max_otp_attempt_count is used up or not
    ) {
        throw new Error('You have used up all your OTP attempts - Try later.')
    } else {
        if (lo_existingUser?.email_verify_otp?.resend_datetime > moment().toDate()) {
        	throw new Error(`Can not Resend the OTP within ${otp_resend} Second.`)
        }
        let li_maxEmailVerifyOtpCount = 0;
        if (lo_existingUser.email_verify_otp && lo_existingUser.email_verify_otp.attempt_count) {
        	li_maxEmailVerifyOtpCount = lo_existingUser.email_verify_otp.attempt_count
        }

		if (lo_existingUser?.email_verify_otp?.attempt_count >= max_otp_attempt_count) {
			li_maxEmailVerifyOtpCount = 0;
		}

        const lo_emailOtp = await generateOtpNew(li_maxEmailVerifyOtpCount)

        lo_existingUser.email_verify_otp = lo_emailOtp
    }
    let lo_savedUser = await lo_existingUser.save();
	
	if (lo_savedUser) {
		// send mail
		lo_savedUser = lo_savedUser.toObject();
		delete lo_savedUser.password;
		delete lo_savedUser.email_verify_otp;
		return lo_savedUser;
	}
	throw new Error("Something went wrong.")
}
export const verifyOtpAndSubmit = async (lo_form) => {
	const ldate_currentDate = moment().toDate();
  
	let lo_existingUser = await UserModel.findOne({
		email: lo_form.email,
		'email_verify_otp.value': lo_form.otp,
		'email_verify_otp.expiry_datetime': { $gt: ldate_currentDate },
	})
  
	if (lo_existingUser) {
	  lo_existingUser = lo_existingUser.toObject();
  
	  if (lo_existingUser.status == "P") {
		const lo_savedDoc = await UserModel.findByIdAndUpdate(lo_existingUser._id, {
		  forget_password_otp: {},
		  status: 'A',
		}, {
		  runValidators: false,
		  new: true,
		});
  
		const lo_returnData = {
		  	name: lo_savedDoc.name,
		  	email: lo_savedDoc.email,
		};
		return lo_returnData;
	  } else {
		throw Error('User already verified');
	  }
	}
	throw Error('OTP is invalid or Expired');
}
export const getUserById = async ls_userId => {
	let lo_user = await UserModel.findById(ls_userId, { email_verify_otp: 0, password: 0, createdAt: 0, updatedAt: 0 });
	return lo_user.toJSON()
}
export const userLogin = async (lo_form) => {
	let lo_user = await UserModel.findOne(
	  	{ email: lo_form.email },
	  	{createdAt: 0, updatedAt: 0 }
	)
	if (lo_user) {
	  if (lo_user.status != 'A') {
		throw Error('Your Account status is Inactive.')
	  } else {
		lo_user = lo_user.toObject();
		console.log(decrypt(lo_user.password), 'decrypt(lo_user.password)');
		if(decrypt(lo_user.password) != lo_form.password) {
			throw Error('Incorrect Email or Password')
		}
		delete lo_user.password;
		delete lo_user.email_verify_otp;
		const ls_jwtToken = generateJwt(lo_user)
		await saveAuthToken(ls_jwtToken, 'user', lo_user._id)
		return { user: lo_user, token: ls_jwtToken }
	  }
	}
	throw Error('Incorrect Email or Password')
}
export const updateUserProfile = async (ls_userId, lo_form) => {
	
	const lo_user = await UserModel.findById(ls_userId)
	if (!lo_user) {
	  throw new Error('user not found')
	}
	lo_user.set(lo_form)  
	await lo_user.validate();
	if (lo_form.profile_image) {
	  	lo_form.profile_image = await addUserProfileImage(lo_form.profile_image)
	}
	const lo_updatedUser = await lo_user.save()
  
	if (!lo_updatedUser) {
	  throw new Error('User not found Profile Update Failed')
	} else {
	  const lo_updatedUserFormated = lo_updatedUser.toObject()
	  return {
		_id: lo_updatedUserFormated._id,
		name: lo_updatedUserFormated.name,
		email: lo_updatedUserFormated.email,
		profile_image: lo_updatedUserFormated.profile_image,
		status: lo_updatedUserFormated.status,
	  }
	}
}