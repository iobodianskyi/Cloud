﻿using System.Web;
using System.Web.Mvc;
using Cloud.Common.Interfaces;
using Cloud.Storages.Repositories;
using Microsoft.AspNet.Identity.Owin;

namespace Cloud.WebApi.Controllers
{
    public class ControllerBase : Controller
    {
        private ApplicationUserManager _userManager;

        protected readonly IFileRepository Repository;

        protected ApplicationUserManager UserManager
        {
            get
            {
                if (_userManager != null) return _userManager;

                _userManager = HttpContext.GetOwinContext()
                    .GetUserManager<ApplicationUserManager>();
                return _userManager;
            }
        }

        protected ControllerBase()
        {
            Repository = new StorageRepository();
        }
    }
}