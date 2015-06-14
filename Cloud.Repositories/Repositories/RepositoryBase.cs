﻿using System;
using System.Data.Entity.Validation;
using System.Linq;
using System.Threading.Tasks;
using Cloud.Common.Interfaces;
using Cloud.Repositories.DataContext;

namespace Cloud.Repositories.Repositories {
	/// <summary>
	///    Base repository class
	/// </summary>
	public abstract class RepositoryBase {
		protected RepositoryBase() {
			Entities = new CloudDbEntities();
			Entities.Configuration.LazyLoadingEnabled = false;
		}

		/// <summary>
		///    Access Cloud entities
		/// </summary>
		public CloudDbEntities Entities { get; private set; }

		/// <summary>
		///    Save context changes to the database
		/// </summary>
		public virtual void SaveChanges() {
			try {
				Entities.SaveChanges();
			} catch (DbEntityValidationException) {
			}

		}

		/// <summary>
		///    Generic method to add entity to the data context
		/// </summary>
		/// <param name="entity">The entity that has to be added to the data context</param>
		/// <param name="isAutoSave">If AutoSave is true the entity will utomatically be saved to the database</param>
		/// <typeparam name="T">Entity type</typeparam>
		public async Task AddAsync<T>( T entity, bool isAutoSave ) where T : class {
			await Task.Run(() => {
				var dbSet = Entities.Set<T>();
				if (dbSet == null) {
					// todo
					throw new Exception("todo");
				}
				dbSet.Add(entity);
				if (isAutoSave) {
					SaveChanges();
				}
			});
		}

		public IStorage ResolveStorageInstance( int storageId ) {
			var storage = Entities.Storages.
				SingleOrDefault(server => server.Id == storageId);
			if (storage == null) return null;
			var storageType = Type.GetType(storage.ClassName, true);
			if (storageType == null) return null;
			var storageInstance = Activator.CreateInstance(storageType, storageId) as IStorage;

			return storageInstance;
		}

		public IStorage ResolveStorageInstance( int storageId, string className ) {
			var storageType = Type.GetType(className, true);
			if (storageType == null) return null;
			var storage = Activator.CreateInstance(storageType, storageId) as IStorage;

			return storage;
		}
	}
}