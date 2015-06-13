﻿using System.Web;
using System.Web.Http;
using Cloud.Storages.Repositories;
using Cloud.WebApi.ExceptionFilters;
using Microsoft.AspNet.Identity.Owin;

namespace Cloud.WebApi.Controllers {
	[Authorize]
	[ExceptionFilter]
	public abstract class ApiControllerBase : ApiController {
		private ApplicationUserManager _userManager;

		protected readonly StorageRepository StorageRepository;
		protected readonly FolderRepository FolderRepository;

		public ApplicationUserManager UserManager {
			get {
				if (_userManager != null) return _userManager;

				_userManager = HttpContext.Current.GetOwinContext()
					.GetUserManager<ApplicationUserManager>();
				return _userManager;
			}
		}

		protected ApiControllerBase() {
			StorageRepository = new StorageRepository();
			FolderRepository = new FolderRepository();
		}
	}
}