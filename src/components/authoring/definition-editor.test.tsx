import * as React from "react";
import DefinitionEditor, { MEDIA_S3_DIR } from "./definition-editor";
import { shallow } from "enzyme";
import { s3Upload } from "../../utils/s3-helpers";
import {v1 as uuid} from "uuid";

jest.mock("../../utils/s3-helpers");
jest.mock("uuid", () => {
  return {
    v1: () => "mock-uuid"
  };
});
// Can't test Dropzone features:
// https://github.com/react-dropzone/react-dropzone/issues/554
// None of the solution works both in the browser and Node.
jest.mock("react-dropzone", () => {
  return {default: "dropzone mock"};
});

const noop = () => undefined;

describe("DefinitionEditor component", () => {
  const s3AccessKey = "s3-access";
  const s3SecretKey = "s3-secret";
  const file = new File(["test"], "test-media.jpg", { type: "image/jpg" });

  it("renders basic UI", () => {
    const wrapper = shallow(
      <DefinitionEditor
        onSave={noop}
        onCancel={noop}
        s3AccessKey={s3AccessKey}
        s3SecretKey={s3SecretKey}
      />
    );
    expect(wrapper.find("input[name='word']").length).toEqual(1);
    expect(wrapper.find("textarea[name='definition']").length).toEqual(1);
    expect(wrapper.find("input[name='image']").length).toEqual(1);
    expect(wrapper.find("input[name='imageCaption']").length).toEqual(1);
    expect(wrapper.find("input[name='video']").length).toEqual(1);
    expect(wrapper.find("input[name='videoCaption']").length).toEqual(1);
    expect(wrapper.find("[data-cy='save']").length).toEqual(1);
    expect(wrapper.find("[data-cy='cancel']").length).toEqual(1);
  });

  describe("saving", () => {
    it("does not call onSave callback if there are any validation errors", () => {
      const saveHandler = jest.fn();
      const wrapper = shallow(
        <DefinitionEditor
          onSave={saveHandler}
          onCancel={noop}
          s3AccessKey={s3AccessKey}
          s3SecretKey={s3SecretKey}
        />
      );
      wrapper.setState({
        definition: {
          word: "",
          definition: "",
          image: "",
          imageCaption: "",
          video: "",
          videoCaption: ""
        }
      });
      expect(wrapper.state("error")).toEqual("");
      wrapper.find("[data-cy='save']").simulate("click");
      // "word" and "definition" values are missing.
      expect(wrapper.state("error")).not.toEqual("");
      expect(saveHandler).not.toHaveBeenCalled();
    });

    it("does call onSave callback if there are no validation errors", () => {
      const saveHandler = jest.fn();
      const wrapper = shallow(
        <DefinitionEditor
          onSave={saveHandler}
          onCancel={noop}
          s3AccessKey={s3AccessKey}
          s3SecretKey={s3SecretKey}
        />
      );
      wrapper.setState({
        definition: {
          word: "test",
          definition: "definition",
          image: "http://test.image.com/test.png",
          imageCaption: "",
          video: "",
          videoCaption: ""
        }
      });
      expect(wrapper.state("error")).toEqual("");
      wrapper.find("[data-cy='save']").simulate("click");
      expect(wrapper.state("error")).toEqual("");
      // Note that properties equal to "" are removed!
      expect(saveHandler).toHaveBeenCalledWith({
        word: "test",
        definition: "definition",
        image: "http://test.image.com/test.png"
      });
    });

    it("does call uploadMedia if there are some files to upload", () => {
      const saveHandler = jest.fn();
      const wrapper = shallow(
        <DefinitionEditor
          onSave={saveHandler}
          onCancel={noop}
          s3AccessKey={s3AccessKey}
          s3SecretKey={s3SecretKey}
        />
      );
      wrapper.setState({
        definition: {
          word: "test",
          definition: "definition",
          image: "",
          imageCaption: "",
          video: "",
          videoCaption: ""
        },
        imageFile: file
      });

      const uploadMediaMock = jest.fn();
      (wrapper.instance() as DefinitionEditor).uploadMedia = uploadMediaMock;

      wrapper.find("[data-cy='save']").simulate("click");
      expect(uploadMediaMock).toHaveBeenCalledWith(file);
    });
  });

  describe(".uploadMedia() method", () => {
    it("uploads a file to S3 bucket", async () => {
      const wrapper = shallow(
        <DefinitionEditor
          onSave={noop}
          onCancel={noop}
          s3AccessKey={s3AccessKey}
          s3SecretKey={s3SecretKey}
        />
      );

      const url = await (wrapper.instance() as DefinitionEditor).uploadMedia(file);

      expect(s3Upload).toHaveBeenCalledWith({
        dir: MEDIA_S3_DIR,
        filename: uuid() + "-" + file.name,
        accessKey: s3AccessKey,
        secretKey: s3SecretKey,
        body: file,
        contentType: file.type,
        cacheControl: "max-age=31536000" // 1 year
      });
      expect(url).toEqual(
        `https://test-resources.mock.concord.org/test-resources/${MEDIA_S3_DIR}/mock-uuid-${file.name}`
      );
    });
  });
});
