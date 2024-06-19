"use strict";

const { Contract } = require("fabric-contract-api");

class LibraryContract extends Contract {
  async addBook(ctx, title, author, publisher, copies) {
    if (copies <= 0) {
      throw new Error("Add at least one copy of the book.");
    }

    let totalNumBooks = await ctx.stub.getState("totalNumBooks");
    totalNumBooks = Number(totalNumBooks.toString()) + 1;

    const book = {
      title: title,
      copies: copies,
      bookID: totalNumBooks,
      author: author,
      publisher: publisher,
      owner: ctx.clientIdentity.getID(),
      lastIssueDate: 0,
      dueDate: 0,
      avgRating: 0,
      borrower: ctx.clientIdentity.getID(),
      availableCopies: copies,
      bookState: "Available",
    };

    await ctx.stub.putState(
      "totalNumBooks",
      Buffer.from(totalNumBooks.toString())
    );
    await ctx.stub.putState(
      "book" + totalNumBooks,
      Buffer.from(JSON.stringify(book))
    );

    return book;
  }

  async reduceCopies(ctx, id, copies) {
    const bookKey = "book" + id;
    const bookAsBytes = await ctx.stub.getState(bookKey);
    if (!bookAsBytes || bookAsBytes.length === 0) {
      throw new Error("Book not found");
    }

    let book = JSON.parse(bookAsBytes.toString());

    if (book.owner !== ctx.clientIdentity.getID()) {
      throw new Error("Only Book owner can reduce copies of the book.");
    }

    if (book.copies < copies) {
      throw new Error("Invalid copies.");
    }

    book.copies -= copies;
    book.availableCopies -= copies;

    await ctx.stub.putState(bookKey, Buffer.from(JSON.stringify(book)));

    return true;
  }

  async removeBook(ctx, id) {
    const bookKey = "book" + id;
    const bookAsBytes = await ctx.stub.getState(bookKey);
    if (!bookAsBytes || bookAsBytes.length === 0) {
      throw new Error("Book not found");
    }

    let book = JSON.parse(bookAsBytes.toString());

    if (book.owner !== ctx.clientIdentity.getID()) {
      throw new Error("Only Book owner can remove the book.");
    }

    book.bookState = "Removed";

    await ctx.stub.deleteState(bookKey);

    let totalNumBooks = await ctx.stub.getState("totalNumBooks");
    totalNumBooks = Number(totalNumBooks.toString()) - 1;
    await ctx.stub.putState(
      "totalNumBooks",
      Buffer.from(totalNumBooks.toString())
    );

    return true;
  }

  async borrowBook(ctx, id, copies) {
    const bookKey = "book" + id;
    const bookAsBytes = await ctx.stub.getState(bookKey);
    if (!bookAsBytes || bookAsBytes.length === 0) {
      throw new Error("Book not found");
    }

    let book = JSON.parse(bookAsBytes.toString());

    if (book.owner === ctx.clientIdentity.getID()) {
      throw new Error("Book owner can't borrow book");
    }

    if (book.availableCopies < copies) {
      throw new Error("Not enough copies for now");
    }

    book.bookState = "Borrowed";
    book.borrower = ctx.clientIdentity.getID();
    book.availableCopies -= copies;
    book.lastIssueDate = Date.now();
    book.dueDate = book.lastIssueDate + 5 * 60 * 1000; // 5 minutes for testing purpose

    await ctx.stub.putState(bookKey, Buffer.from(JSON.stringify(book)));

    return book;
  }

  async returnBook(ctx, id, copies) {
    const bookKey = "book" + id;
    const bookAsBytes = await ctx.stub.getState(bookKey);
    if (!bookAsBytes || bookAsBytes.length === 0) {
      throw new Error("Book not found");
    }

    let book = JSON.parse(bookAsBytes.toString());

    if (book.borrower !== ctx.clientIdentity.getID()) {
      throw new Error("You don't own this book");
    }

    book.availableCopies += copies;
    book.bookState = "Available";

    await ctx.stub.putState(bookKey, Buffer.from(JSON.stringify(book)));

    return true;
  }

  async renewBook(ctx, id) {
    const bookKey = "book" + id;
    const bookAsBytes = await ctx.stub.getState(bookKey);
    if (!bookAsBytes || bookAsBytes.length === 0) {
      throw new Error("Book not found");
    }

    let book = JSON.parse(bookAsBytes.toString());

    if (book.borrower !== ctx.clientIdentity.getID()) {
      throw new Error("You don't own this book");
    }

    book.bookState = "Renewed";
    book.lastIssueDate = Date.now();
    book.dueDate = book.lastIssueDate + 5 * 60 * 1000; // 5 minutes for testing purpose

    await ctx.stub.putState(bookKey, Buffer.from(JSON.stringify(book)));

    return true;
  }

  async getAvailableBooks(ctx) {
    let availableBooks = [];

    let totalNumBooks = await ctx.stub.getState("totalNumBooks");
    totalNumBooks = Number(totalNumBooks.toString());

    for (let i = 1; i <= totalNumBooks; i++) {
      const bookKey = "book" + i;
      const bookAsBytes = await ctx.stub.getState(bookKey);
      if (bookAsBytes && bookAsBytes.length > 0) {
        let book = JSON.parse(bookAsBytes.toString());
        if (book.availableCopies > 0) {
          availableBooks.push(book);
        }
      }
    }

    return availableBooks;
  }

  async getBorrowedBookTitles(ctx) {
    const borrower = ctx.clientIdentity.getID();
    let borrowedBookIds = await ctx.stub.getState(borrower);
    borrowedBookIds = JSON.parse(borrowedBookIds.toString());

    let borrowedBookTitles = [];

    for (let i = 0; i < borrowedBookIds.length; i++) {
      const bookKey = "book" + borrowedBookIds[i];
      const bookAsBytes = await ctx.stub.getState(bookKey);
      if (bookAsBytes && bookAsBytes.length > 0) {
        let book = JSON.parse(bookAsBytes.toString());
        borrowedBookTitles.push(book.title);
      }
    }

    return borrowedBookTitles;
  }

  async addReview(ctx, id, rating) {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const bookKey = "book" + id;
    const bookAsBytes = await ctx.stub.getState(bookKey);
    if (!bookAsBytes || bookAsBytes.length === 0) {
      throw new Error("Book not found");
    }

    let book = JSON.parse(bookAsBytes.toString());

    if (!book.avgRating) {
      book.avgRating = 0;
    }

    let totalnumberratings =
      1 * book.rating.one +
      2 * book.rating.two +
      3 * book.rating.three +
      4 * book.rating.four +
      5 * book.rating.five;

    let weightedtotal =
      1 * book.rating.one +
      2 * book.rating.two +
      3 * book.rating.three +
      4 * book.rating.four +
      5 * book.rating.five;

    book.avgRating = weightedtotal / totalnumberratings;

    await ctx.stub.putState(bookKey, Buffer.from(JSON.stringify(book)));

    return book.avgRating;
  }
}

module.exports = LibraryContract;
